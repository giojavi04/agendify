import type { createClient } from '../supabase/server';
import { booking, fictionalLabels, SchedulingError, utcDay, uuid } from './validation.ts';

type Client = NonNullable<Awaited<ReturnType<typeof createClient>>>;
export type Scope = { client: Client; organizationId: string };

function fail(error: { code?: string } | null) {
  if (error) throw new SchedulingError(error.code === '23P01' ? 'conflict' : 'unavailable');
}

export async function listDay(scope: Scope, day: unknown) {
  const { start, end } = utcDay(day);
  const { data, error } = await scope.client.from('appointments')
    .select('id,site_id,professional_id,patient_id,starts_at,ends_at,status,patients!inner(display_label,is_synthetic)')
    .eq('organization_id', uuid(scope.organizationId)).eq('patients.is_synthetic', true)
    .in('patients.display_label', [...fictionalLabels]).gte('starts_at', start).lt('starts_at', end)
    .order('starts_at');
  fail(error);
  if (!Array.isArray(data) || data.some((row) => {
    const patient: unknown = row.patients;
    return !patient || typeof patient !== 'object' || !('display_label' in patient) || !('is_synthetic' in patient) ||
      patient.is_synthetic !== true || !fictionalLabels.some((label) => label === patient.display_label);
  })) throw new SchedulingError('unavailable');
  return data;
}

export async function createBooking(scope: Scope, input: unknown) {
  uuid(scope.organizationId);
  const value = booking(input);
  const { data: assignment, error: assignmentError } = await scope.client.from('professional_sites').select('site_id')
    .eq('organization_id', scope.organizationId).eq('site_id', value.siteId)
    .eq('professional_id', value.professionalId).maybeSingle();
  fail(assignmentError);
  if (!assignment) throw new SchedulingError('invalid');
  const { data: patient, error: patientError } = await scope.client.from('patients').select('display_label,is_synthetic')
    .eq('organization_id', scope.organizationId).eq('id', value.patientId).eq('is_synthetic', true).maybeSingle();
  fail(patientError);
  if (!patient || patient.is_synthetic !== true || !fictionalLabels.some((label) => label === patient.display_label)) throw new SchedulingError('invalid');
  const { data, error } = await scope.client.from('appointments').insert({
    organization_id: scope.organizationId, site_id: value.siteId,
    professional_id: value.professionalId, patient_id: value.patientId,
    starts_at: value.startsAt, ends_at: value.endsAt,
  }).select('id').single();
  fail(error);
  if (!data) throw new SchedulingError('unavailable');
  return data;
}

export async function cancelBooking(scope: Scope, id: unknown) {
  const appointmentId = uuid(id);
  const { data, error } = await scope.client.from('appointments').update({ status: 'cancelled' })
    .eq('organization_id', uuid(scope.organizationId)).eq('id', appointmentId)
    .eq('status', 'confirmed').select('id').maybeSingle();
  fail(error);
  if (!data) throw new SchedulingError('invalid');
  return data;
}
