import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MAX_PARTY_ONLINE, slotsFor } from './slots.ts';

const now = new Date('2026-11-02T08:00:00Z'); // a Monday morning
const empty = () => 0;

test('closed on Mondays', () => { assert.deepEqual(slotsFor('2026-11-02', 2, now, empty), []); });
test('Tuesday has dinner only, every 15 minutes from 19:00 to 22:00', () => {
  const s = slotsFor('2026-11-03', 2, now, empty);
  assert.equal(s[0].time, '19:00');
  assert.equal(s.at(-1)!.time, '22:00');
  assert.equal(s.length, 13);
  assert.ok(s.every((x) => x.service === 'Cena'));
});
test('Saturday has lunch and dinner', () => {
  const services = new Set(slotsFor('2026-11-07', 2, now, empty).map((x) => x.service));
  assert.deepEqual([...services].sort(), ['Cena', 'Pranzo']);
});
test('past dates and oversized parties are rejected', () => {
  assert.deepEqual(slotsFor('2026-11-01', 2, now, empty), []);
  assert.deepEqual(slotsFor('2026-11-03', MAX_PARTY_ONLINE + 1, now, empty), []);
});
test('same-day slots less than 2 hours away are hidden', () => {
  const lateSat = new Date('2026-11-07T18:10:00Z');
  assert.equal(slotsFor('2026-11-07', 2, lateSat, empty)[0].time, '20:15');
});
test('a slot is full when remaining seats are fewer than the party', () => {
  const s = slotsFor('2026-11-03', 4, now, () => 14);
  assert.ok(s.every((x) => x.seatsLeft === 0));
});
