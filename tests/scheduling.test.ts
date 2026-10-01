import assert from 'node:assert/strict';
import { test } from 'node:test';
import { booking, SchedulingError, syntheticOnly, utcDay } from '../lib/scheduling/validation.ts';
import { cancelBooking, createBooking, listDay } from '../lib/scheduling/repository.ts';

const org = '11111111-1111-4111-8111-111111111111';
const site = '22222222-2222-4222-8222-222222222222';
const professional = '33333333-3333-4333-8333-333333333333';
const patient = '44444444-4444-4444-8444-444444444444';
const input = { siteId: site, professionalId: professional, patientId: patient, startsAt: '2026-10-01T12:00:00Z' };

function scope(options: { missing?: string; conflict?: boolean; synthetic?: boolean; label?: string } = {}) {
  const calls: string[] = [];
  const filters: Array<[string, unknown]> = [];
  const client = { from(table: string) {
    calls.push(table);
    const query = {
      select(_columns: string) { return query; },
      eq(field: string, value: unknown) { filters.push([field, value]); return query; },
      in(field: string, value: unknown) { filters.push([field, value]); return query; },
      gte(field: string, value: unknown) { filters.push([field, value]); return query; },
      lt(field: string, value: unknown) { filters.push([field, value]); return query; },
      order: async (_field: string) => ({ data: [], error: null }),
      maybeSingle: async () => ({ data: table === options.missing ? null : {
        id: site, site_id: site, display_label: options.label ?? 'Persona Alfa', is_synthetic: options.synthetic ?? true,
      }, error: null }),
      single: async () => ({ data: { id: site }, error: options.conflict ? { code: '23P01' } : null }),
      insert(_value: unknown) { return query; }, update(_value: unknown) { return query; },
    };
    return query;
  } };
  return { staff: { client, organizationId: org } as never, calls, filters };
}

test('synthetic-only gate denies explicitly unless enabled', () => {
  assert.throws(() => syntheticOnly(false), (error: unknown) => error instanceof SchedulingError && error.code === 'unavailable');
  assert.doesNotThrow(() => syntheticOnly(true));
});

test('UTC slot boundaries allow 08:00 and 17:30, deny out-of-hours', () => {
  for (const time of ['08:00', '17:30']) assert.doesNotThrow(() => booking({ ...input, startsAt: `2026-10-01T${time}:00Z` }));
  for (const time of ['07:30', '17:45', '18:00']) assert.throws(() => booking({ ...input, startsAt: `2026-10-01T${time}:00Z` }), SchedulingError);
});

test('invalid dates, UTC instants, free-text fields and identifiers are rejected', () => {
  assert.throws(() => utcDay('2026-02-30'), SchedulingError);
  assert.throws(() => booking({ ...input, startsAt: '2026-10-01T12:00:00+02:00' }), SchedulingError);
  assert.throws(() => booking({ ...input, startsAt: '2026-10-01T12:15:00Z' }), SchedulingError);
  assert.throws(() => booking({ ...input, patientName: 'Real Patient' }), SchedulingError);
  assert.throws(() => booking({ ...input, patientId: 'bad' }), SchedulingError);
});

test('day listing filters synthetic fictional patients and UTC range in database', async () => {
  const { staff, filters } = scope();
  await listDay(staff, '2026-10-01');
  assert.deepEqual(filters, [
    ['organization_id', org], ['patients.is_synthetic', true],
    ['patients.display_label', ['Persona Alfa', 'Persona Beta', 'Persona Gamma', 'Persona Delta']],
    ['starts_at', '2026-10-01T00:00:00.000Z'], ['starts_at', '2026-10-02T00:00:00.000Z'],
  ]);
});

test('cross-org or unassigned professional cannot create', async () => {
  const { staff, calls, filters } = scope({ missing: 'professional_sites' });
  await assert.rejects(createBooking(staff, input), SchedulingError);
  assert.deepEqual(calls, ['professional_sites']);
  assert.deepEqual(filters.slice(0, 3), [['organization_id', org], ['site_id', site], ['professional_id', professional]]);
});

test('non-synthetic and non-fictional patient cannot create', async () => {
  for (const options of [{ synthetic: false }, { label: 'Unknown' }, { missing: 'patients' }]) {
    const { staff, calls } = scope(options);
    await assert.rejects(createBooking(staff, input), SchedulingError);
    assert.deepEqual(calls, ['professional_sites', 'patients']);
  }
});

test('database exclusion conflict returns generic slot error', async () => {
  const { staff } = scope({ conflict: true });
  await assert.rejects(createBooking(staff, input), (error: unknown) => error instanceof SchedulingError && error.code === 'conflict');
});

test('cancellation scopes update and rejects missing or foreign appointment', async () => {
  const { staff, filters } = scope({ missing: 'appointments' });
  await assert.rejects(cancelBooking(staff, site), SchedulingError);
  assert.deepEqual(filters, [['organization_id', org], ['id', site], ['status', 'confirmed']]);
  await assert.rejects(cancelBooking(staff, 'bad'), SchedulingError);
});
