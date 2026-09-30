import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { InputError, openScheduling } from './scheduling.js';

function queryId(value) {
  if (value === null) return undefined;
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) throw new InputError('Invalid siteId');
  return Number(value);
}

async function body(request) {
  let data = '';
  for await (const chunk of request) {
    data += chunk;
    if (data.length > 16_384) throw new InputError('Request body too large', 413);
  }
  try { return JSON.parse(data); } catch { throw new InputError('Invalid JSON'); }
}

export function createServer({ dbPath = ':memory:', host = '127.0.0.1' } = {}) {
  if (host !== '127.0.0.1' && host !== '::1') throw new Error('Only loopback hosts are allowed');
  const store = openScheduling(dbPath);
  const server = http.createServer(async (request, response) => {
    const send = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(value));
    };
    try {
      const url = new URL(request.url, 'http://localhost');
      const siteId = () => queryId(url.searchParams.get('siteId'));
      if (request.method === 'GET' && url.pathname === '/api/sites') return send(200, store.sites());
      if (request.method === 'GET' && url.pathname === '/api/professionals') return send(200, store.professionals(siteId()));
      if (request.method === 'GET' && url.pathname === '/api/appointments') return send(200, store.appointments(url.searchParams.get('date'), siteId()));
      if (request.method === 'POST' && url.pathname === '/api/appointments') return send(201, store.create(await body(request)));
      const match = url.pathname.match(/^\/api\/appointments\/(\d+)\/cancel$/);
      if (request.method === 'PATCH' && match) return send(200, store.cancel(Number(match[1])));
      send(404, { error: 'Route not found' });
    } catch (error) {
      if (error instanceof InputError) return send(error.status, { error: error.message });
      console.error(error);
      send(500, { error: 'Internal server error' });
    }
  });
  server.on('close', () => store.close());
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  createServer({ dbPath: process.env.DB_PATH ?? 'agendify.sqlite' }).listen(port, '127.0.0.1', () => {
    console.log(`Agendify pilot listening on http://127.0.0.1:${port}`);
  });
}
