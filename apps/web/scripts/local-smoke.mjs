import { execFileSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

// Capture CLI credentials in memory only; never include CLI output or SDK errors in diagnostics.
const root = fileURLToPath(new URL('../../../', import.meta.url));
const fail = (message) => { throw new Error(message); };
const check = (result, label) => {
  if (result.error) fail(`${label} failed (code ${result.error.code ?? 'unknown'})`);
  return result.data;
};
const one = (result, label) => {
  const rows = check(result, label);
  if (!rows || (Array.isArray(rows) && rows.length !== 1)) fail(`${label} returned unexpected rows`);
  return Array.isArray(rows) ? rows[0] : rows;
};
const localHost = (host) => host === '127.0.0.1' || host === 'localhost' || host === '[::1]';

let output;
try {
  output = execFileSync('supabase', ['status', '--output', 'env'], {
    cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000,
  });
} catch {
  fail('Local Supabase status unavailable; start the local stack first');
}
const vars = Object.fromEntries(output.split(/\r?\n/).flatMap((line) => {
  const match = /^([A-Z_]+)=(.*)$/.exec(line);
  if (!match) return [];
  const raw = match[2];
  return [[match[1], raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw]];
}));
let api, db;
try {
  api = new URL(vars.API_URL);
  db = new URL(vars.DB_URL);
} catch {
  fail('Local API_URL and DB_URL are required');
}
if (api.protocol !== 'http:' || !localHost(api.hostname) || api.username || api.password ||
    api.pathname !== '/' || api.search || api.hash || !api.port ||
    !['postgres:', 'postgresql:'].includes(db.protocol) || !localHost(db.hostname) ||
    !db.port || !db.pathname || db.pathname === '/' || db.search || db.hash ||
    !vars.SERVICE_ROLE_KEY || !vars.ANON_KEY) {
  fail('Refusing nonlocal or invalid Supabase API/DB endpoints or missing local keys');
}
// No admin client is constructed until both independent endpoints have passed validation.
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(api.origin, vars.SERVICE_ROLE_KEY, options);
const tag = `local-smoke-${randomUUID()}`;
const ids = { users: [], organizations: [], memberships: [], sites: [], professionals: [], assignments: [], patients: [], appointments: [] };
const record = (kind, row) => { ids[kind].push(row); return row; };
const cleanupErrors = [];
const cleanup = async (kind, table, filters) => {
  for (const row of ids[kind].reverse()) {
    let query = admin.from(table).delete();
    for (const [key, value] of Object.entries(filters(row))) query = query.eq(key, value);
    try {
      const { error } = await query;
      if (error) cleanupErrors.push(`${table} ${JSON.stringify(row)} (code ${error.code ?? 'unknown'})`);
      const identity = filters(row);
      let remaining = admin.from(table).select('*');
      for (const [key, value] of Object.entries(identity)) remaining = remaining.eq(key, value);
      const verified = await remaining.limit(1);
      if (verified.error || verified.data?.length !== 0) cleanupErrors.push(`${table} ${JSON.stringify(row)} (removal unverified)`);
    } catch {
      cleanupErrors.push(`${table} ${JSON.stringify(row)} (request failed)`);
    }
  }
};
let failure;
try {
  const credential = () => ({ email: `${randomUUID()}@example.invalid`, password: randomBytes(32).toString('hex') });
  const staffLogin = credential();
  const outsiderLogin = credential();
  for (const login of [staffLogin, outsiderLogin]) {
    const created = check(await admin.auth.admin.createUser({ ...login, email_confirm: true }), 'create synthetic user');
    if (!created.user?.id) fail('Synthetic user creation returned no ID');
    record('users', created.user.id);
  }
  const org = record('organizations', one(await admin.from('organizations').insert({ name: tag }).select('id'), 'create organization').id);
  record('memberships', { organization_id: org, user_id: ids.users[0] });
  check(await admin.from('memberships').insert(ids.memberships[0]), 'create membership');
  const site = record('sites', one(await admin.from('sites').insert({ organization_id: org, name: tag }).select('id'), 'create site').id);
  const professional = record('professionals', one(await admin.from('professionals').insert({ organization_id: org, name: tag }).select('id'), 'create professional').id);
  const assignment = record('assignments', { organization_id: org, site_id: site, professional_id: professional });
  check(await admin.from('professional_sites').insert(assignment), 'assign professional');
  const patient = record('patients', one(await admin.from('patients').insert({ organization_id: org, display_label: `${tag} fictional patient`, is_synthetic: true }).select('id'), 'create fictional patient').id);
  const signedIn = check(await createClient(api.origin, vars.ANON_KEY, options).auth.signInWithPassword(staffLogin), 'staff sign-in');
  const deniedIn = check(await createClient(api.origin, vars.ANON_KEY, options).auth.signInWithPassword(outsiderLogin), 'outsider sign-in');
  if (!signedIn.session?.access_token || !deniedIn.session?.access_token) fail('Local Auth did not return sessions');
  const scoped = (token) => createClient(api.origin, vars.ANON_KEY, { ...options, global: { headers: { Authorization: `Bearer ${token}` } } });
  const staff = scoped(signedIn.session.access_token);
  const outsider = scoped(deniedIn.session.access_token);
  if (one(await staff.from('patients').select('id').eq('id', patient), 'staff patient read').id !== patient) fail('Staff patient mismatch');
  if (check(await outsider.from('patients').select('id').eq('id', patient), 'outsider patient read').length !== 0) fail('Outsider read patient');
  const start = new Date(Date.now() + 86400000).toISOString();
  const end = new Date(Date.now() + 88200000).toISOString();
  const booking = { organization_id: org, site_id: site, professional_id: professional, patient_id: patient, starts_at: start, ends_at: end };
  const appointment = record('appointments', one(await staff.from('appointments').insert(booking).select('id'), 'staff booking').id);
  const conflict = await staff.from('appointments').insert(booking);
  if (!conflict.error?.code || conflict.error.code !== '23P01') fail('Overlap was not rejected by exclusion constraint');
  const outsiderBooking = await outsider.from('appointments').insert({
    ...booking,
    starts_at: new Date(Date.now() + 90000000).toISOString(),
    ends_at: new Date(Date.now() + 91800000).toISOString(),
  });
  if (outsiderBooking.error?.code !== '42501') fail('Outsider appointment insert was not denied by RLS');
  if (check(await outsider.from('appointments').select('id').eq('id', appointment), 'outsider appointment read').length !== 0) fail('Outsider read appointment');
  if (check(await outsider.from('appointments').update({ status: 'cancelled' }).eq('id', appointment).select('id'), 'outsider cancellation').length !== 0) fail('Outsider cancelled appointment');
  if (one(await staff.from('appointments').update({ status: 'cancelled' }).eq('id', appointment).select('id,status'), 'staff cancellation').status !== 'cancelled') fail('Cancellation did not persist');
  console.log('Local synthetic Auth/PostgREST smoke passed');
} catch (error) {
  failure = error;
} finally {
  await cleanup('appointments', 'appointments', (id) => ({ id }));
  await cleanup('patients', 'patients', (id) => ({ id }));
  await cleanup('assignments', 'professional_sites', (row) => row);
  await cleanup('professionals', 'professionals', (id) => ({ id }));
  await cleanup('sites', 'sites', (id) => ({ id }));
  await cleanup('memberships', 'memberships', (row) => row);
  await cleanup('organizations', 'organizations', (id) => ({ id }));
  for (const id of ids.users.reverse()) {
    try {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (error) cleanupErrors.push(`auth.users ${id} (code ${error.code ?? 'unknown'})`);
      const verified = await admin.auth.admin.getUserById(id);
      if (verified.data?.user || (verified.error && verified.error.status !== 404)) {
        cleanupErrors.push(`auth.users ${id} (removal unverified)`);
      }
    } catch {
      cleanupErrors.push(`auth.users ${id} (request failed)`);
    }
  }
}
if (cleanupErrors.length) console.error(`Cleanup failed for created IDs: ${cleanupErrors.join('; ')}`);
if (failure) console.error(failure instanceof Error && failure.message.startsWith('Smoke ') ? failure.message : 'Smoke failed; inspect local service health without sharing credentials');
if (failure || cleanupErrors.length) process.exitCode = 1;
