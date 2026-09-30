import { DatabaseSync } from 'node:sqlite';

export class InputError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(\d{2}):(\d{2})$/;
const validId = value => Number.isSafeInteger(value) && value > 0;

export function validateDate(date) {
  if (typeof date !== 'string' || !datePattern.test(date)) throw new InputError('Invalid date');
  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (parsed.getUTCFullYear() !== year || parsed.getUTCMonth() + 1 !== month || parsed.getUTCDate() !== day) throw new InputError('Invalid date');
  return date;
}

export function validateTime(time) {
  const match = typeof time === 'string' && time.match(timePattern);
  if (!match) throw new InputError('Invalid time');
  const minutes = Number(match[1]) * 60 + Number(match[2]);
  if (minutes < 480 || minutes >= 1080 || minutes % 30 !== 0) throw new InputError('Time must be a 30-minute slot from 08:00 through 17:30');
  return time;
}

function text(value, field) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 120) throw new InputError(`Invalid ${field}`);
  return value.trim();
}

export function openScheduling(dbPath = ':memory:') {
  const db = new DatabaseSync(dbPath);
  db.exec(`PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS sites (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS professionals (id INTEGER PRIMARY KEY, siteId INTEGER NOT NULL REFERENCES sites(id), name TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY, siteId INTEGER NOT NULL REFERENCES sites(id),
      professionalId INTEGER NOT NULL REFERENCES professionals(id),
      date TEXT NOT NULL, time TEXT NOT NULL, patientName TEXT NOT NULL,
      service TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('confirmed', 'cancelled'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS active_slot ON appointments(professionalId, date, time) WHERE status = 'confirmed';`);
  db.prepare('INSERT OR IGNORE INTO sites (id, name) VALUES (1, ?), (2, ?)').run('Synthetic North', 'Synthetic South');
  db.prepare('INSERT OR IGNORE INTO professionals (id, siteId, name) VALUES (1, 1, ?), (2, 2, ?)').run('Alex Example', 'Sam Example');

  return {
    close: () => db.close(),
    sites: () => db.prepare('SELECT * FROM sites ORDER BY id').all(),
    professionals(siteId) {
      if (siteId !== undefined && !validId(siteId)) throw new InputError('Invalid siteId');
      return siteId === undefined
        ? db.prepare('SELECT * FROM professionals ORDER BY id').all()
        : db.prepare('SELECT * FROM professionals WHERE siteId = ? ORDER BY id').all(siteId);
    },
    appointments(date, siteId) {
      validateDate(date);
      if (siteId !== undefined && !validId(siteId)) throw new InputError('Invalid siteId');
      return siteId === undefined
        ? db.prepare('SELECT * FROM appointments WHERE date = ? ORDER BY time, id').all(date)
        : db.prepare('SELECT * FROM appointments WHERE date = ? AND siteId = ? ORDER BY time, id').all(date, siteId);
    },
    create(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new InputError('Invalid appointment');
      const { siteId, professionalId, date, time } = input;
      if (!validId(siteId) || !validId(professionalId)) throw new InputError('Invalid siteId or professionalId');
      validateDate(date);
      validateTime(time);
      const patientName = text(input.patientName, 'patientName');
      const service = text(input.service, 'service');
      if (!db.prepare('SELECT id FROM sites WHERE id = ?').get(siteId)) throw new InputError('Site not found', 404);
      const professional = db.prepare('SELECT siteId FROM professionals WHERE id = ?').get(professionalId);
      if (!professional) throw new InputError('Professional not found', 404);
      if (professional.siteId !== siteId) throw new InputError('Professional does not belong to site');
      try {
        const result = db.prepare(`INSERT INTO appointments (siteId, professionalId, date, time, patientName, service, status)
          VALUES (?, ?, ?, ?, ?, ?, 'confirmed')`).run(siteId, professionalId, date, time, patientName, service);
        return db.prepare('SELECT * FROM appointments WHERE id = ?').get(result.lastInsertRowid);
      } catch (error) {
        if (error.code === 'ERR_SQLITE_ERROR' && /UNIQUE constraint failed/.test(error.message)) throw new InputError('Slot already booked', 409);
        throw error;
      }
    },
    cancel(id) {
      if (!validId(id)) throw new InputError('Invalid appointment id');
      const result = db.prepare("UPDATE appointments SET status = 'cancelled' WHERE id = ? AND status = 'confirmed'").run(id);
      if (!result.changes) {
        if (!db.prepare('SELECT id FROM appointments WHERE id = ?').get(id)) throw new InputError('Appointment not found', 404);
        throw new InputError('Appointment already cancelled', 409);
      }
      return db.prepare('SELECT * FROM appointments WHERE id = ?').get(id);
    }
  };
}
