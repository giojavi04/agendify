import assert from 'node:assert/strict';
import test from 'node:test';
import { demo } from '../lib/demo.ts';

test('fixtures contain unique chronological fictional slots', () => {
  const slots = demo.appointments.map(({ time, professional }) => `${professional}:${time}`);
  assert.equal(new Set(slots).size, slots.length);
  assert.deepEqual(demo.appointments.map(({ time }) => time), [...demo.appointments.map(({ time }) => time)].sort());
  assert.ok(demo.appointments.every(({ patient, service }) => /^Persona (Alfa|Beta|Gamma|Delta)$/.test(patient) && service.endsWith('de muestra')));
});

test('dashboard overview counts agree with fixture rows', () => {
  assert.equal(Number(demo.metrics[0].value), 8); // Illustrative daily total, not just visible preview rows.
  assert.ok(demo.appointments.length <= Number(demo.metrics[0].value));
  assert.equal(new Set(demo.appointments.map(({ professional }) => professional)).size, Number(demo.metrics[1].value));
  assert.equal(new Set(demo.appointments.map(({ site }) => site)).size, Number(demo.metrics[2].value));
});
