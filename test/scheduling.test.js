import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openScheduling, validateDate, validateTime } from '../src/scheduling.js';

const sample = { siteId: 1, professionalId: 1, date: '2026-10-01', time: '08:00', patientName: 'Synthetic Person', service: 'Demo service' };

test('seed, filters, conflict and cancellation', () => {
  const store = openScheduling();
  try {
    assert.equal(store.sites().length, 2);
    assert.equal(store.professionals(2).length, 1);
    assert.equal(store.professionals(2)[0].siteId, 2);
    const created = store.create(sample);
    assert.equal(created.status, 'confirmed');
    assert.equal(store.appointments(sample.date, 1).length, 1);
    assert.equal(store.appointments(sample.date, 2).length, 0);
    assert.throws(() => store.create(sample), error => error.status === 409);
    assert.equal(store.cancel(created.id).status, 'cancelled');
    assert.throws(() => store.cancel(created.id), error => error.status === 409);
    assert.equal(store.create(sample).status, 'confirmed');
  } finally { store.close(); }
});

test('invalid scheduling inputs', () => {
  const store = openScheduling();
  try {
    for (const date of ['2026-02-30', '2026-13-01', 'bad']) assert.throws(() => validateDate(date));
    for (const time of ['07:30', '18:00', '08:15', 'bad']) assert.throws(() => validateTime(time));
    assert.throws(() => store.create({ ...sample, siteId: 2 }), error => error.status === 400);
    assert.throws(() => store.create({ ...sample, professionalId: 999 }), error => error.status === 404);
    assert.throws(() => store.create({ ...sample, patientName: ' ' }), error => error.status === 400);
    assert.throws(() => store.cancel(999), error => error.status === 404);
  } finally { store.close(); }
});
