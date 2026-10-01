import assert from 'node:assert/strict';
import { test } from 'node:test';
import { listChoices } from '../lib/scheduling/repository.ts';
import { patientLabel, schedulingMessage } from '../lib/scheduling/presentation.ts';
import { readFileSync } from 'node:fs';

test('many-to-one patient labels render from objects, never array indexing', () => {
  assert.equal(patientLabel({ display_label: 'Persona Beta', is_synthetic: true }), 'Persona Beta');
  assert.equal(patientLabel(null), 'Paciente ficticio');
  assert.equal(patientLabel([{ display_label: 'Persona Beta' }]), 'Paciente ficticio');
});

test('booking UI keeps independent choices, agenda and mutation errors', () => {
  const source = readFileSync(new URL('../app/dashboard/booking-client.tsx', import.meta.url), 'utf8');
  for (const state of ['choicesError', 'agendaError', 'mutationError']) {
    assert.match(source, new RegExp(`\\[${state}, set[A-Z]\\w+\\] = useState`));
    assert.match(source, new RegExp(`\\{${state} && <p role="alert"`));
  }
  assert.match(source, /disabled=\{busy \|\| !choices\}/);
  assert.match(source, /patientLabel\(row\.patients\)/);
  assert.doesNotMatch(source, /patients\[0\]/);
  assert.match(source, /finally \{ await load\(day\); setBusy\(false\); \}/);
  assert.equal(schedulingMessage('Slot unavailable.'), 'El horario ya no está disponible.');
});

const org = '11111111-1111-4111-8111-111111111111';
const site = '22222222-2222-4222-8222-222222222222';
const professional = '33333333-3333-4333-8333-333333333333';
const patient = '44444444-4444-4444-8444-444444444444';

function fake(label = 'Persona Alfa', synthetic = true) {
  const filters: Array<[string, unknown]> = [];
  const client = { from(table: string) {
    let query: { select: (value: string) => typeof query; eq: (field: string, value: unknown) => typeof query; in: (field: string, value: unknown) => typeof query; then: (resolve: (result: unknown) => void) => void };
    query = {
      select: () => query,
      eq: (field, value) => { filters.push([`${table}.${field}`, value]); return query; },
      in: (field, value) => { filters.push([`${table}.${field}`, value]); return query; },
      then: (resolve) => resolve({ data: table === 'sites' ? [{ id: site, name: 'Demo site' }]
        : table === 'professionals' ? [{ id: professional, name: 'Demo professional' }]
        : table === 'professional_sites' ? [{ site_id: site, professional_id: professional }]
        : [{ id: patient, display_label: label, is_synthetic: synthetic }], error: null }),
    };
    return query;
  } };
  return { scope: { client, organizationId: org } as never, filters };
}

test('booking choices scope every table to organization and only fictional synthetic patients', async () => {
  const { scope, filters } = fake();
  const choices = await listChoices(scope);
  assert.deepEqual(choices.patients, [{ id: patient, label: 'Persona Alfa' }]);
  assert.deepEqual(choices.assignments, [{ site_id: site, professional_id: professional }]);
  for (const table of ['sites', 'professionals', 'professional_sites', 'patients']) {
    assert.ok(filters.some(([field, value]) => field === `${table}.organization_id` && value === org));
  }
  assert.ok(filters.some(([field, value]) => field === 'patients.is_synthetic' && value === true));
  assert.ok(filters.some(([field, value]) => field === 'patients.display_label' && Array.isArray(value) && value.includes('Persona Alfa')));
});

test('unexpected real or non-fictional patient response fails closed', async () => {
  for (const [label, synthetic] of [['Real person', true], ['Persona Alfa', false]] as const) {
    await assert.rejects(listChoices(fake(label, synthetic).scope), /Scheduling unavailable/);
  }
});
