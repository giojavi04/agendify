import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from '../src/server.js';

async function start(dbPath = ':memory:') {
  const server = createServer({ dbPath });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return { server, root: `http://127.0.0.1:${server.address().port}` };
}

async function call(root, path, method = 'GET', value) {
  const response = await fetch(root + path, { method, headers: value === undefined ? {} : { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value) });
  return { status: response.status, data: await response.json() };
}

const appointment = { siteId: 1, professionalId: 1, date: '2026-10-01', time: '17:30', patientName: 'Demo Patient', service: 'Synthetic visit' };

test('HTTP endpoints, errors, filters and persisted appointments', async () => {
  const dbPath = join(mkdtempSync(join(tmpdir(), 'agendify-test-')), 'pilot.sqlite');
  let { server, root } = await start(dbPath);
  try {
    assert.equal((await call(root, '/api/sites')).data.length, 2);
    assert.equal((await call(root, '/api/professionals?siteId=2')).data[0].siteId, 2);
    assert.equal((await call(root, '/api/appointments?date=2026-10-01')).data.length, 0);
    const created = await call(root, '/api/appointments', 'POST', appointment);
    assert.equal(created.status, 201);
    assert.equal((await call(root, '/api/appointments', 'POST', appointment)).status, 409);
    assert.equal((await call(root, '/api/appointments?date=2026-10-01&siteId=2')).data.length, 0);
    assert.equal((await call(root, '/api/appointments?date=2026-10-01&siteId=1')).data.length, 1);
    assert.equal((await call(root, '/api/appointments', 'POST', { ...appointment, time: '18:00' })).status, 400);
    assert.equal((await call(root, '/api/appointments', 'POST', { ...appointment, siteId: 2 })).status, 400);
    assert.equal((await call(root, '/api/appointments?date=2026-02-30')).status, 400);
    assert.equal((await call(root, '/api/professionals?siteId=abc')).status, 400);
    assert.equal((await call(root, '/api/appointments/999/cancel', 'PATCH')).status, 404);
    assert.equal((await call(root, `/api/appointments/${created.data.id}/cancel`, 'PATCH')).data.status, 'cancelled');
    assert.equal((await call(root, '/api/appointments', 'POST', appointment)).status, 201);
  } finally { await new Promise(resolve => server.close(resolve)); }
  ({ server, root } = await start(dbPath));
  try {
    const rows = (await call(root, '/api/appointments?date=2026-10-01')).data;
    assert.deepEqual(rows.map(row => row.status), ['cancelled', 'confirmed']);
    assert.equal((await call(root, '/api/sites')).data.length, 2);
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('server disallows non-loopback bind configuration', () => {
  assert.throws(() => createServer({ host: '0.0.0.0' }), /loopback/);
});
