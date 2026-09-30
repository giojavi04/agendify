const $ = id => document.getElementById(id);
const date = $('date');
const site = $('site');
const professional = $('professional');
const time = $('time');
const message = $('message');
const list = $('appointments');
let professionals = [];
let refreshId = 0;
let siteRequestId = 0;

function notice(text, error = false) {
  message.textContent = text;
  message.classList.toggle('error', error);
}
function option(select, value, label) {
  const item = document.createElement('option');
  item.value = value;
  item.textContent = label;
  select.append(item);
}
async function api(path, options) {
  const response = await fetch(path, options);
  let data;
  try { data = await response.json(); } catch { throw new Error('No se pudo leer la respuesta del servidor.'); }
  if (!response.ok) throw new Error(data.error || 'La solicitud no se pudo completar.');
  return data;
}
function render(rows) {
  list.replaceChildren();
  if (!rows.length) { list.textContent = 'No hay turnos para esta fecha y sede.'; return; }
  const ul = document.createElement('ul');
  ul.className = 'list';
  for (const row of rows) {
    const li = document.createElement('li');
    li.className = `entry ${row.status === 'cancelled' ? 'cancelled' : ''}`;
    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = `${row.time} · ${row.patientName}`;
    const description = document.createElement('p');
    description.textContent = `${professionals.find(p => p.id === row.professionalId)?.name || 'Profesional'} · ${row.service}`;
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = row.status === 'confirmed' ? 'Confirmado' : 'Cancelado';
    details.append(title, description, badge);
    li.append(details);
    if (row.status === 'confirmed') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'secondary';
      button.textContent = 'Cancelar turno';
      button.setAttribute('aria-label', `Cancelar turno de ${row.patientName} a las ${row.time}`);
      button.addEventListener('click', async () => {
        button.disabled = true;
        notice('Cancelando turno…');
        try {
          await api(`/api/appointments/${row.id}/cancel`, { method: 'PATCH' });
          notice('Turno cancelado.');
          await loadAppointments();
        } catch (error) { notice(error.message, true); button.disabled = false; }
      });
      li.append(button);
    }
    ul.append(li);
  }
  list.append(ul);
}
async function loadAppointments() {
  const id = ++refreshId;
  if (!site.value) return;
  list.textContent = 'Cargando turnos…';
  try {
    const rows = await api(`/api/appointments?date=${encodeURIComponent(date.value)}&siteId=${encodeURIComponent(site.value)}`);
    if (id === refreshId) render(rows);
  } catch (error) { if (id === refreshId) { list.textContent = 'No se pudo cargar la agenda.'; notice(error.message, true); } }
}
async function loadSite() {
  const id = ++siteRequestId;
  ++refreshId;
  professional.replaceChildren();
  professional.disabled = true;
  list.textContent = 'Cargando agenda…';
  try {
    const loaded = await api(`/api/professionals?siteId=${encodeURIComponent(site.value)}`);
    if (id !== siteRequestId) return;
    professionals = loaded;
    for (const person of professionals) option(professional, person.id, person.name);
    professional.disabled = !professionals.length;
    if (!professionals.length) notice('Esta sede no tiene profesionales disponibles.');
    await loadAppointments();
  } catch (error) { if (id === siteRequestId) { list.textContent = 'No se pudo cargar la agenda.'; notice(error.message, true); } }
}
function localToday() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
async function init() {
  date.value = localToday();
  for (let hour = 8; hour < 18; hour++) for (const minute of ['00', '30']) {
    const slot = `${String(hour).padStart(2, '0')}:${minute}`;
    option(time, slot, slot);
  }
  list.textContent = 'Cargando agenda…';
  try {
    const sites = await api('/api/sites');
    if (!sites.length) { list.textContent = 'No hay sedes disponibles.'; return; }
    for (const entry of sites) option(site, entry.id, entry.name);
    await loadSite();
  } catch (error) { list.textContent = 'No se pudo cargar la agenda.'; notice(error.message, true); }
}
site.addEventListener('change', () => { notice(''); loadSite(); });
date.addEventListener('change', () => { notice(''); if (date.value && site.value) loadAppointments(); });
$('booking').addEventListener('submit', async event => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  notice('Guardando turno…');
  try {
    const form = new FormData(event.currentTarget);
    await api('/api/appointments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      date: date.value, siteId: Number(site.value), professionalId: Number(professional.value), time: time.value,
      patientName: form.get('patientName'), service: form.get('service')
    }) });
    event.currentTarget.elements.namedItem('patientName').value = '';
    event.currentTarget.elements.namedItem('service').value = '';
    notice('Turno confirmado.');
    await loadAppointments();
  } catch (error) { notice(error.message, true); }
  finally { button.disabled = false; }
});
init();
