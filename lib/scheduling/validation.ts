export class SchedulingError extends Error {
  readonly code: 'invalid' | 'unavailable' | 'conflict';
  constructor(code: 'invalid' | 'unavailable' | 'conflict') {
    super(code === 'conflict' ? 'Slot unavailable.' : code === 'invalid' ? 'Invalid request.' : 'Scheduling unavailable.');
    this.code = code;
  }
}

export function syntheticOnly(enabled: boolean) {
  if (!enabled) throw new SchedulingError('unavailable');
}

export const fictionalLabels = ['Persona Alfa', 'Persona Beta', 'Persona Gamma', 'Persona Delta'] as const;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function uuid(value: unknown): string {
  if (typeof value !== 'string' || !uuidPattern.test(value)) throw new SchedulingError('invalid');
  return value;
}

export function utcDay(value: unknown): { start: string; end: string } {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new SchedulingError('invalid');
  const start = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.toISOString().slice(0, 10) !== value) throw new SchedulingError('invalid');
  return { start: start.toISOString(), end: new Date(start.getTime() + 86_400_000).toISOString() };
}

export function booking(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new SchedulingError('invalid');
  const value = input as Record<string, unknown>;
  if (Object.keys(value).sort().join(',') !== 'patientId,professionalId,siteId,startsAt') throw new SchedulingError('invalid');
  const siteId = uuid(value.siteId);
  const professionalId = uuid(value.professionalId);
  const patientId = uuid(value.patientId);
  const startsAt = value.startsAt;
  if (typeof startsAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:00(?:\.000)?Z$/.test(startsAt)) throw new SchedulingError('invalid');
  const date = new Date(startsAt);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== startsAt.replace(/:00Z$/, ':00.000Z') || (date.getUTCHours() < 8 || date.getUTCHours() > 17 || (date.getUTCHours() === 17 && date.getUTCMinutes() > 30) || date.getUTCMinutes() % 30 !== 0)) throw new SchedulingError('invalid');
  utcDay(date.toISOString().slice(0, 10));
  return { siteId, professionalId, patientId, startsAt: date.toISOString(), endsAt: new Date(date.getTime() + 1_800_000).toISOString() };
}
