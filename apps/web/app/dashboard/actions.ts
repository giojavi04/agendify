'use server';

import { requireStaff } from '../../lib/auth/staff';
import { cancelBooking, createBooking, listDay, listChoices } from '../../lib/scheduling/data';
import { SchedulingError } from '../../lib/scheduling/validation';

async function run<T>(operation: (scope: Awaited<ReturnType<typeof requireStaff>>) => Promise<T>) {
  // Redirects from authentication must escape the scheduling error boundary.
  const scope = await requireStaff();
  try {
    return { ok: true as const, data: await operation(scope) };
  } catch (error) {
    return { ok: false as const, error: error instanceof SchedulingError ? error.message : 'Scheduling unavailable.' };
  }
}

export async function getChoices() {
  return run((scope) => listChoices(scope));
}

export async function listBookings(day: string) {
  return run((scope) => listDay(scope, day));
}

export async function createAppointment(input: unknown) {
  return run((scope) => createBooking(scope, input));
}

export async function cancelAppointment(id: string) {
  return run((scope) => cancelBooking(scope, id));
}
