/** Reservation slot engine: pure functions, unit-tested in slots.test.ts. */

export interface Service { name: 'Pranzo' | 'Cena'; open: string; lastSeating: string }
export interface Slot { time: string; service: Service['name']; seatsLeft: number }

/** 0 = Sunday … 6 = Saturday. Closed on Mondays; no lunch on Tuesdays. */
export const schedule: Record<number, Service[]> = {
  0: [{ name: 'Pranzo', open: '12:00', lastSeating: '14:00' }],
  1: [],
  2: [{ name: 'Cena', open: '19:00', lastSeating: '22:00' }],
  3: [{ name: 'Pranzo', open: '12:00', lastSeating: '13:45' }, { name: 'Cena', open: '19:00', lastSeating: '22:00' }],
  4: [{ name: 'Pranzo', open: '12:00', lastSeating: '13:45' }, { name: 'Cena', open: '19:00', lastSeating: '22:00' }],
  5: [{ name: 'Pranzo', open: '12:00', lastSeating: '13:45' }, { name: 'Cena', open: '19:00', lastSeating: '22:30' }],
  6: [{ name: 'Pranzo', open: '12:00', lastSeating: '14:00' }, { name: 'Cena', open: '19:00', lastSeating: '22:30' }],
};

export const SEATS_PER_SLOT = 16;
export const MAX_PARTY_ONLINE = 8;

const toMin = (hhmm: string) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const toHhmm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
export const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).getUTCDay();

/** Deterministic pseudo-occupancy per date+time so the demo looks alive but stable. */
export function occupancy(iso: string, time: string): number {
  let h = 2166136261;
  for (const c of iso + time) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  const base = (h >>> 0) % (SEATS_PER_SLOT + 1);
  const peak = ['20:00', '20:15', '20:30', '13:00'].includes(time) ? 6 : 0;
  return Math.min(SEATS_PER_SLOT, base + peak);
}

/**
 * Lists bookable slots for a date and party size.
 * `now` lets callers (and tests) hide slots that start less than 2 hours from now.
 */
export function slotsFor(iso: string, party: number, now: Date, occ: (d: string, t: string) => number = occupancy): Slot[] {
  if (party < 1 || party > MAX_PARTY_ONLINE) return [];
  const services = schedule[weekday(iso)] ?? [];
  const nowIso = now.toISOString().slice(0, 10);
  if (iso < nowIso) return [];
  const cutoff = iso === nowIso ? now.getUTCHours() * 60 + now.getUTCMinutes() + 120 : -1;
  const out: Slot[] = [];
  for (const s of services) {
    for (let m = toMin(s.open); m <= toMin(s.lastSeating); m += 15) {
      if (m < cutoff) continue;
      const time = toHhmm(m);
      const seatsLeft = SEATS_PER_SLOT - occ(iso, time);
      out.push({ time, service: s.name, seatsLeft: seatsLeft >= party ? seatsLeft : 0 });
    }
  }
  return out;
}
