import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
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

function createServer(dbPath) {
  const store = openScheduling(dbPath);
  const server = http.createServer(async (request, response) => {
    const send = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
      response.end(JSON.stringify(value));
    };
    try {
      const url = new URL(request.url, 'http://localhost');
      const staticFiles = {
        '/': ['index.html', 'text/html; charset=utf-8'],
        '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
        '/style.css': ['style.css', 'text/css; charset=utf-8']
      };
      if (request.method === 'GET' && Object.hasOwn(staticFiles, url.pathname)) {
        const [name, type] = staticFiles[url.pathname];
        const content = await readFile(fileURLToPath(new URL(`../public/${name}`, import.meta.url)));
        response.writeHead(200, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff' });
        return response.end(content);
      }
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

export async function startServer({ dbPath = ':memory:', port = 0 } = {}) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  const server = createServer(dbPath);
  try {
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(port, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
    return server;
  } catch (error) {
    server.close();
    throw error;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid PORT');
  startServer({ dbPath: process.env.DB_PATH ?? 'agendify.sqlite', port }).then(() => {
    console.log(`Agendify pilot listening on http://127.0.0.1:${port}`);
  });
}
