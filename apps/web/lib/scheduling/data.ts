import 'server-only';
import type { Scope } from './repository';
import { cancelBooking as cancel, createBooking as create, listDay as list, listChoices as choices } from './repository';
import { syntheticOnly } from './validation';

/** Production entry point: never accept a caller-provided gate override. */
function gate() {
  syntheticOnly(process.env.AGENDIFY_SYNTHETIC_ONLY === 'true');
}

export async function listChoices(scope: Scope) {
  gate();
  return choices(scope);
}

export async function listDay(scope: Scope, day: unknown) {
  gate();
  return list(scope, day);
}

export async function createBooking(scope: Scope, input: unknown) {
  gate();
  return create(scope, input);
}

export async function cancelBooking(scope: Scope, id: unknown) {
  gate();
  return cancel(scope, id);
}
