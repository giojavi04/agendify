import { spawn } from 'node:child_process';
import { randomInt } from 'node:crypto';
import { chromium } from 'playwright-core';
import { localServices, syntheticFixture } from './local-fixture.mjs';

let fixture, browser, child, failure, servicesForCleanup;
let stage = 'local services';
const stopped = (process) => process.exitCode !== null || process.signalCode !== null;
const waitForExit = (process, milliseconds) => new Promise((resolve) => {
  if (stopped(process)) return resolve(true);
  const timer = setTimeout(() => finish(stopped(process)), milliseconds);
  const onExit = () => finish(true);
  function finish(exited) {
    clearTimeout(timer);
    process.removeListener('exit', onExit);
    resolve(exited);
  }
  process.once('exit', onExit);
});
try {
  const services = localServices();
  servicesForCleanup = services;
  stage = 'fixture creation';
  fixture = await syntheticFixture(services);
  const { login, site, professional, patient, ids } = await fixture.create();
  stage = 'Next startup';
  const port = 31000 + randomInt(20000);
  const base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', String(port)], {
    cwd: new URL('../', import.meta.url),
    env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: services.api, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: services.anon, AGENDIFY_SYNTHETIC_ONLY: 'true' },
    stdio: 'ignore',
  });
  const executablePath = process.env.AGENDIFY_CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  // No remote browser endpoints or inherited debugging session.
  if (!executablePath.startsWith('/') || !(await import('node:fs')).existsSync(executablePath)) throw new Error('Local Chrome executable unavailable');
  stage = 'browser launch';
  browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext();
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url());
    return url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ? route.continue() : route.abort();
  });
  const page = await context.newPage();
  stage = 'login readiness';
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error('Next child exited before becoming ready');
    try { const response = await page.goto(`${base}/login`, { timeout: 3000 }); if (response?.ok()) break; }
    catch { /* dev startup */ }
    if (attempt === 59) throw new Error('Local Next login did not become ready');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  stage = 'authentication';
  await page.getByLabel('Correo electrónico').fill(login.email);
  await page.getByLabel('Contraseña').fill(login.password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await page.waitForURL(`${base}/dashboard`, { timeout: 30000 });
  await page.getByRole('heading', { name: 'Agenda de demostración' }).waitFor();
  stage = 'booking';
  await page.getByLabel('Sede').selectOption(site);
  await page.getByLabel('Profesional asignado').selectOption(professional);
  await page.getByLabel('Paciente ficticio').selectOption(patient);
  const day = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Día (UTC)').fill(day);
  await page.getByLabel('Horario (UTC, 30 minutos)').selectOption('08:00');
  await page.getByRole('button', { name: 'Confirmar cita de demostración' }).click();
  await page.getByText('La cita de demostración fue confirmada.').waitFor();
  const row = page.locator('.booking-list li').filter({ hasText: 'Persona Alfa' });
  await row.getByText('Confirmada').waitFor();
  const query = () => services.admin.from('appointments').select('id,status,starts_at').eq('organization_id', ids.organizations[0]).eq('site_id', site).eq('patient_id', patient);
  const created = await query();
  if (created.error || created.data?.length !== 1 || created.data[0].status !== 'confirmed' || created.data[0].starts_at !== `${day}T08:00:00+00:00`) throw new Error('Browser booking DB assertion failed');
  ids.appointments.push(created.data[0].id);
  stage = 'cancellation';
  await row.getByRole('button', { name: 'Cancelar' }).click();
  await page.getByText('La cita de demostración fue cancelada.').waitFor();
  await row.getByText('Cancelada').waitFor();
  const cancelled = await query();
  if (cancelled.error || cancelled.data?.length !== 1 || cancelled.data[0].status !== 'cancelled') throw new Error('Browser cancellation DB assertion failed');
  console.log('Local authenticated Next browser smoke passed');
} catch { failure = new Error(`Browser smoke failed at ${stage}; inspect local runtime without sharing credentials`); }
finally {
  try { await browser?.close(); } catch { failure ??= new Error('Browser smoke failed at browser close'); }
  if (child && !stopped(child)) {
    child.kill('SIGTERM');
    if (!(await waitForExit(child, 5000))) {
      child.kill('SIGKILL');
      if (!(await waitForExit(child, 5000))) failure = new Error('Browser smoke failed at child shutdown');
    }
  }
  try {
    if (fixture) {
      if (fixture.ids.organizations.length) {
        const { data, error } = await servicesForCleanup.admin.from('appointments').select('id').eq('organization_id', fixture.ids.organizations[0]);
        if (error) throw new Error('Unable to enumerate synthetic appointments');
        for (const row of data) if (!fixture.ids.appointments.includes(row.id)) fixture.ids.appointments.push(row.id);
      }
      await fixture.cleanup();
    }
  } catch { failure = new Error('Browser smoke failed at synthetic cleanup'); }
}
if (failure) { console.error(failure.message); process.exitCode = 1; }
