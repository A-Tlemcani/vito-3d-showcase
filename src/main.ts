import '@fontsource-variable/playfair-display';
import '@fontsource-variable/inter';
import './style.css';
import { dietLabels, menu, type Diet } from './menu';
import { MAX_PARTY_ONLINE, slotsFor } from './slots';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
  const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n;
};

// ---------- Menu: accessible tabs + dietary filters
const courses = Object.keys(menu);
let activeCourse = courses[0];
const activeDiets = new Set<Diet>();
const tabs = $('tabs');
const panel = $('menu-panel');

courses.forEach((c, i) => {
  const b = el('button', 'tab', c);
  b.type = 'button'; b.id = `tab-${i}`;
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-controls', 'menu-panel');
  b.addEventListener('click', () => { activeCourse = c; renderMenu(); });
  b.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!d) return;
    const next = (courses.indexOf(activeCourse) + d + courses.length) % courses.length;
    activeCourse = courses[next]; renderMenu(); (tabs.children[next] as HTMLElement).focus();
  });
  tabs.append(b);
});
(Object.keys(dietLabels) as Diet[]).forEach((d) => {
  const b = el('button', `chip chip-${d}`, dietLabels[d]);
  b.type = 'button'; b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    activeDiets.has(d) ? activeDiets.delete(d) : activeDiets.add(d);
    b.setAttribute('aria-pressed', String(activeDiets.has(d)));
    renderMenu();
  });
  $('filters').append(b);
});

function renderMenu() {
  [...tabs.children].forEach((t, i) => {
    const on = courses[i] === activeCourse;
    t.setAttribute('aria-selected', String(on)); (t as HTMLElement).tabIndex = on ? 0 : -1;
    if (on) panel.setAttribute('aria-labelledby', t.id);
  });
  const dishes = menu[activeCourse].filter((d) => [...activeDiets].every((x) => d.diet.includes(x) || (x === 'v' && d.diet.includes('vg'))));
  if (!dishes.length) { panel.replaceChildren(el('p', 'empty', 'No dish matches these filters in this course. Try another course or ask your waiter: the kitchen adapts most dishes.')); return; }
  panel.replaceChildren(...dishes.map((d) => {
    const row = el('article', `dish${d.signature ? ' signature' : ''}`);
    const head = el('div', 'dish-head');
    head.append(el('h3', undefined, d.name), el('span', 'leader'), el('span', 'dish-price', `€${d.price}`));
    const tags = el('ul', 'dish-tags');
    if (d.signature) tags.append(el('li', 'sig', 'Signature'));
    d.diet.forEach((x) => tags.append(el('li', `chip-${x}`, dietLabels[x])));
    row.append(head, el('p', undefined, d.desc), tags);
    return row;
  }));
}
renderMenu();

// ---------- Reservation
const dateIn = $('r-date') as HTMLInputElement;
const partyIn = $('r-party') as HTMLSelectElement;
const slotsEl = $('slots');
const err = $('r-error');
let chosen: string | null = null;

/** "Now" expressed as Paris wall-clock time in a UTC Date, matching the slot engine's convention. */
function parisNow(): Date {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date()).map((p) => [p.type, p.value]));
  return new Date(`${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:00Z`);
}
const today = parisNow().toISOString().slice(0, 10);
dateIn.min = today;
const max = new Date(parisNow().getTime() + 60 * 86_400_000).toISOString().slice(0, 10);
dateIn.max = max;
// Default to the next open day
for (let i = 0; i < 7; i++) {
  const iso = new Date(parisNow().getTime() + i * 86_400_000).toISOString().slice(0, 10);
  if (slotsFor(iso, 2, parisNow()).some((s) => s.seatsLeft)) { dateIn.value = iso; break; }
}
for (let i = 1; i <= MAX_PARTY_ONLINE; i++) { const o = el('option', undefined, `${i} ${i > 1 ? 'guests' : 'guest'}`); o.value = String(i); partyIn.append(o); }
partyIn.value = '2';

function renderSlots() {
  chosen = null;
  const slots = dateIn.value ? slotsFor(dateIn.value, Number(partyIn.value), parisNow()) : [];
  if (!slots.length) { slotsEl.replaceChildren(el('p', 'empty', dateIn.value ? 'We are closed or fully booked on this day. Try another date.' : 'Choose a date.')); return; }
  const groups = new Map<string, HTMLElement>();
  for (const s of slots) {
    if (!groups.has(s.service)) { const g = el('div', 'slot-group'); g.append(el('p', 'slot-service', s.service === 'Pranzo' ? 'Pranzo · Lunch' : 'Cena · Dinner')); groups.set(s.service, g); }
    const b = el('button', 'slot', s.time);
    b.type = 'button'; b.disabled = !s.seatsLeft;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `${s.time}${s.seatsLeft ? (s.seatsLeft <= 4 ? ', only a few tables left' : ', available') : ', full'}`);
    if (s.seatsLeft && s.seatsLeft <= 4) b.classList.add('few');
    b.addEventListener('click', () => {
      chosen = s.time;
      slotsEl.querySelectorAll('.slot').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      err.textContent = '';
    });
    groups.get(s.service)!.append(b);
  }
  slotsEl.replaceChildren(...groups.values());
}
dateIn.addEventListener('change', renderSlots);
partyIn.addEventListener('change', renderSlots);
renderSlots();

const form = $('reserve-form') as HTMLFormElement;
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!chosen) { err.textContent = 'Please choose a time.'; return; }
  if (!form.checkValidity()) { err.textContent = 'Please check your name, phone and email.'; form.reportValidity(); return; }
  const data = new FormData(form);
  const name = String(data.get('name')).trim().split(/\s+/)[0];
  const date = new Date(`${dateIn.value}T12:00:00Z`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  $('done-title').textContent = `A presto, ${name}!`;
  $('done-body').textContent = `Table for ${partyIn.value} on ${date} at ${chosen}. This is a demo: no reservation was sent and nothing left your browser.`;
  ($('done') as HTMLDialogElement).showModal();
  const keepDate = dateIn.value;
  form.reset(); dateIn.value = keepDate; partyIn.value = '2'; renderSlots();
});

// ---------- Scroll story + 3D (lazy)
const story = $('story');
const chapters = [...story.querySelectorAll<HTMLElement>('.chapter')];
const bar = $('story-bar');
let sceneApi: { setProgress(p: number): void } | null = null;
const onScroll = () => {
  const r = story.getBoundingClientRect();
  const p = Math.min(Math.max(-r.top / (r.height - innerHeight), 0), 1);
  const idx = Math.min(chapters.length - 1, Math.floor(p * chapters.length * 0.999));
  chapters.forEach((c, i) => c.classList.toggle('is-active', i === idx));
  bar.style.setProperty('--p', String(p));
  sceneApi?.setProgress(p);
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
const loader = $('loader');
const start = () => import('./scene').then((m) => {
  sceneApi = m.initScene($('scene') as HTMLCanvasElement,
    (k) => { $('loader-pct').textContent = `${Math.round(k * 100)}%`; },
    () => { loader.classList.add('done'); story.classList.add('ready'); onScroll(); });
  if (!sceneApi) loader.classList.add('done');
});
'requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 800 }) : setTimeout(start, 100);
