import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = fileURLToPath(new URL('../', import.meta.url));
const loopback = (host) => host === 'localhost' || host === '127.0.0.1' || host === '[::1]';
export function localServices() {
  let output;
  try { output = execFileSync('supabase', ['status', '--output', 'env'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }); }
  catch { throw new Error('Local Supabase status unavailable'); }
  const vars = Object.fromEntries(output.split(/\r?\n/).flatMap((line) => {
    const match = /^([A-Z_]+)=(.*)$/.exec(line);
    return match ? [[match[1], match[2].replace(/^"|"$/g, '')]] : [];
  }));
  let api, db;
  try { api = new URL(vars.API_URL); db = new URL(vars.DB_URL); }
  catch { throw new Error('Local API and DB endpoints required'); }
  if (api.protocol !== 'http:' || !loopback(api.hostname) || !api.port || api.username || api.password || api.pathname !== '/' || api.search || api.hash ||
      !['postgres:', 'postgresql:'].includes(db.protocol) || !loopback(db.hostname) || !db.port || !db.pathname || db.pathname === '/' || db.search || db.hash ||
      !vars.SERVICE_ROLE_KEY || !vars.ANON_KEY) throw new Error('Refusing nonlocal or invalid Supabase endpoints');
  return { api: api.origin, anon: vars.ANON_KEY, admin: createClient(api.origin, vars.SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } }) };
}

export async function syntheticFixture({ admin }) {
  const ids = { users: [], organizations: [], memberships: [], sites: [], professionals: [], assignments: [], patients: [], appointments: [] };
  const record = (kind, value) => { ids[kind].push(value); return value; };
  const required = (result, label) => {
    if (result.error || !result.data) throw new Error(`${label} failed (code ${result.error?.code ?? 'unknown'})`);
    return result.data;
  };
  const inserted = async (query, label) => {
    const rows = required(await query.select('id'), label);
    if (rows.length !== 1) throw new Error(`${label} returned unexpected rows`);
    return rows[0].id;
  };
  const tag = `browser-smoke-${randomUUID()}`;
  const login = { email: `${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') };
  const cleanup = async () => {
    const errors = [];
    for (const [kind, table, identity] of [
      ['appointments', 'appointments', (id) => ({ id })], ['patients', 'patients', (id) => ({ id })],
      ['assignments', 'professional_sites', (row) => row], ['professionals', 'professionals', (id) => ({ id })],
      ['sites', 'sites', (id) => ({ id })], ['memberships', 'memberships', (row) => row], ['organizations', 'organizations', (id) => ({ id })],
    ]) for (const row of ids[kind].reverse()) {
      const filter = identity(row);
      let deletion = admin.from(table).delete();
      for (const [key, value] of Object.entries(filter)) deletion = deletion.eq(key, value);
      try {
        const result = await deletion;
        let verification = admin.from(table).select('*');
        for (const [key, value] of Object.entries(filter)) verification = verification.eq(key, value);
        const remaining = await verification.limit(1);
        if (result.error || remaining.error || remaining.data?.length !== 0) errors.push(`${table} removal unverified`);
      } catch { errors.push(`${table} removal failed`); }
    }
    for (const id of ids.users.reverse()) try {
      const removed = await admin.auth.admin.deleteUser(id);
      const remaining = await admin.auth.admin.getUserById(id);
      if (removed.error || remaining.data?.user || (remaining.error && remaining.error.status !== 404)) errors.push('auth user removal unverified');
    } catch { errors.push('auth user removal failed'); }
    if (errors.length) throw new Error(`Synthetic cleanup failed: ${errors.join('; ')}`);
  };
  const create = async () => {
    const user = required(await admin.auth.admin.createUser({ ...login, email_confirm: true }), 'create user').user;
    if (!user?.id) throw new Error('Missing synthetic user ID');
    record('users', user.id);
    const org = record('organizations', await inserted(admin.from('organizations').insert({ name: tag }), 'organization'));
    record('memberships', { organization_id: org, user_id: user.id });
    required(await admin.from('memberships').insert(ids.memberships[0]).select('user_id'), 'membership');
    const site = record('sites', await inserted(admin.from('sites').insert({ organization_id: org, name: tag }), 'site'));
    const professional = record('professionals', await inserted(admin.from('professionals').insert({ organization_id: org, name: tag }), 'professional'));
    record('assignments', { organization_id: org, site_id: site, professional_id: professional });
    required(await admin.from('professional_sites').insert(ids.assignments[0]).select('site_id'), 'assignment');
    const patient = record('patients', await inserted(admin.from('patients').insert({ organization_id: org, display_label: 'Persona Alfa', is_synthetic: true }), 'patient'));
    return { login, tag, org, site, professional, patient, ids, cleanup };
  };
  return { create, cleanup, ids };
}
