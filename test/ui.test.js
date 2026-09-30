import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const html = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../public/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../public/style.css', import.meta.url), 'utf8');

test('UI provides accessible Spanish pilot boundary and booking controls', () => {
  assert.match(html, /lang="es"/);
  assert.match(html, /solo para pacientes sintéticos.*No apto para uso clínico/);
  for (const id of ['date', 'site', 'professional', 'time', 'appointments', 'message']) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /<form id="booking">/);
});

test('UI uses safe text insertion and exposes agenda states and brand tokens', () => {
  assert.doesNotMatch(js, /innerHTML|outerHTML|insertAdjacentHTML/);
  assert.match(js, /textContent = `\$\{row.time\} · \$\{row.patientName\}`/);
  for (const text of ['Cargando turnos', 'No hay turnos', 'No se pudo cargar', 'Confirmado', 'Cancelado']) assert.ok(js.includes(text));
  for (const color of ['#2563EB', '#08204F', '#0EA5E9', '#14B8A6', '#F0F7FE', '#64748B']) assert.ok(css.includes(color));
  assert.match(css, /@media\s*\(max-width:\s*550px\)/);
});

function deferred() {
  let resolve;
  const promise = new Promise(done => { resolve = done; });
  return { promise, resolve };
}

async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

test('date change while sites are pending waits for a site and clears stale errors', async () => {
  const elements = new Map();
  function element() {
    const node = {
      value: '', textContent: '', disabled: false, children: [], listeners: {},
      classList: { toggle(_name, enabled) { node.error = enabled; } },
      append(...items) { this.children.push(...items); if (!this.value && items[0]) this.value = items[0].value; },
      replaceChildren() { this.children = []; this.value = ''; },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      setAttribute() {}
    };
    return node;
  }
  for (const id of ['date', 'site', 'professional', 'time', 'message', 'appointments', 'booking']) elements.set(id, element());
  const sites = deferred();
  const requests = [];
  runInNewContext(js, {
    document: { getElementById: id => elements.get(id), createElement: element },
    fetch(path) {
      requests.push(path);
      if (path === '/api/sites') return sites.promise;
      if (path.startsWith('/api/professionals')) return Promise.resolve({ ok: true, json: async () => [{ id: 3, name: 'Profesional' }] });
      return Promise.resolve({ ok: true, json: async () => [] });
    },
    Date, String, Number, encodeURIComponent
  });
  const message = elements.get('message');
  message.textContent = 'Error anterior';
  message.error = true;
  elements.get('date').listeners.change();
  await flush();
  assert.deepEqual(requests, ['/api/sites']);
  sites.resolve({ ok: true, json: async () => [{ id: 7, name: 'Sede' }] });
  await flush();
  await flush();
  assert.ok(requests.some(path => path.includes('/api/appointments?') && path.includes('siteId=7')), `${requests.join(', ')}; ${message.textContent}`);
  assert.equal(message.textContent, '');
  assert.equal(message.error, false);
});

test('date refresh cannot invalidate site loading; older site responses cannot replace professionals', async () => {
  const elements = new Map();
  function element() {
    return {
      value: '', textContent: '', disabled: false, children: [], listeners: {},
      classList: { toggle() {} },
      append(...items) { this.children.push(...items); if (!this.value && items[0]) this.value = items[0].value; },
      replaceChildren() { this.children = []; this.value = ''; },
      addEventListener(name, callback) { this.listeners[name] = callback; },
      setAttribute() {},
      elements: { namedItem(name) { return elements.get(name); } },
      querySelector() { return elements.get('submit'); }
    };
  }
  for (const id of ['date', 'site', 'professional', 'time', 'message', 'appointments', 'booking', 'patientName', 'service', 'submit']) elements.set(id, element());
  const pending = [];
  const context = {
    document: { getElementById: id => elements.get(id), createElement: element },
    fetch(path) {
      if (path === '/api/sites') return Promise.resolve({ ok: true, json: async () => [{ id: 1, name: 'One' }, { id: 2, name: 'Two' }] });
      if (path.startsWith('/api/professionals')) {
        const request = deferred(); pending.push(request); return request.promise;
      }
      return Promise.resolve({ ok: true, json: async () => [] });
    },
    Date, String, Number, FormData: class { constructor(form) { this.form = form; } get(name) { return this.form.elements.namedItem(name).value; } },
    encodeURIComponent
  };
  runInNewContext(js, context);
  await flush();
  const site = elements.get('site');
  site.value = '2';
  site.listeners.change();
  elements.get('date').listeners.change();
  pending[1].resolve({ ok: true, json: async () => [{ id: 2, name: 'Current' }] });
  await flush();
  assert.equal(elements.get('professional').disabled, false);
  assert.equal(elements.get('professional').children[0].textContent, 'Current');
  pending[0].resolve({ ok: true, json: async () => [{ id: 1, name: 'Stale' }] });
  await flush();
  assert.equal(elements.get('professional').children[0].textContent, 'Current');
  assert.equal(elements.get('professional').disabled, false);
});
