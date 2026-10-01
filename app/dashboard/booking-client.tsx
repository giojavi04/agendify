'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cancelAppointment, createAppointment, getChoices, listBookings } from './actions';
import { patientLabel, schedulingMessage } from '../../lib/scheduling/presentation';

type Choices = NonNullable<Awaited<ReturnType<typeof getChoices>>['data']>;
type Bookings = NonNullable<Awaited<ReturnType<typeof listBookings>>['data']>;
const slots = Array.from({ length: 20 }, (_, index) => `${String(8 + Math.floor(index / 2)).padStart(2, '0')}:${index % 2 ? '30' : '00'}`);
const today = () => new Date().toISOString().slice(0, 10);

export default function BookingClient() {
  const [day, setDay] = useState(today);
  const [site, setSite] = useState('');
  const [choices, setChoices] = useState<Choices | null>(null);
  const [rows, setRows] = useState<Bookings>([]);
  const [professional, setProfessional] = useState('');
  const [patient, setPatient] = useState('');
  const [time, setTime] = useState('08:00');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [choicesError, setChoicesError] = useState('');
  const [agendaError, setAgendaError] = useState('');
  const [mutationError, setMutationError] = useState('');
  const [notice, setNotice] = useState('');
  const request = useRef(0);
  const load = useCallback(async (date: string) => {
    const current = ++request.current;
    setLoading(true);
    setAgendaError('');
    try {
      const result = await listBookings(date);
      if (current !== request.current) return;
      if (result.ok) setRows(result.data);
      else { setRows([]); setAgendaError(schedulingMessage(result.error)); }
    } catch {
      if (current === request.current) { setRows([]); setAgendaError(schedulingMessage('')); }
    } finally {
      if (current === request.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    let active = true;
    getChoices().then((result) => {
      if (!active) return;
      if (result.ok) { setChoices(result.data); setChoicesError(''); }
      else { setChoices(null); setChoicesError(schedulingMessage(result.error)); }
    }).catch(() => { if (active) setChoicesError(schedulingMessage('')); });
    return () => { active = false; };
  }, []);
  useEffect(() => { void load(day); return () => { request.current++; }; }, [day, load]);
  const selectedSite = choices?.sites.some((entry) => entry.id === site) ? site : '';
  const assigned = choices?.assignments.filter((entry) => entry.site_id === selectedSite).map((entry) => entry.professional_id) ?? [];
  const availableProfessionals = choices?.professionals.filter((entry) => assigned.includes(entry.id)) ?? [];
  const selectedProfessional = availableProfessionals.some((entry) => entry.id === professional) ? professional : '';
  const selectedPatient = choices?.patients.some((entry) => entry.id === patient) ? patient : '';
  const visible = rows.filter((row) => row.site_id === selectedSite);
  async function mutate(operation: () => Promise<{ ok: boolean; error?: string }>, success: string) {
    setBusy(true); setNotice(''); setMutationError('');
    request.current++;
    try {
      const result = await operation();
      if (!result.ok) setMutationError(schedulingMessage(result.error ?? ''));
      else setNotice(success);
    } catch { setMutationError(schedulingMessage('')); }
    finally { await load(day); setBusy(false); }
  }
  return <main className="booking-page">
    <header><p className="eyebrow">AGENDIFY · ESPACIO DE TRABAJO</p><h1>Agenda de demostración</h1></header>
    <div className="booking-warning" role="alert"><strong>Demostración exclusiva con datos sintéticos.</strong> Solo pacientes ficticios. No se permiten cuentas de pacientes reales, notas clínicas ni reservas de producción. Todas las fechas y horas se muestran en UTC; aún no se consideran las zonas horarias de las sedes.</div>
    {choicesError && <p role="alert" className="booking-error">{choicesError}</p>}
    <section aria-label="Filtros de agenda" className="booking-panel booking-filters">
      <label>Día (UTC)<input type="date" value={day} disabled={busy} onChange={(event) => { setNotice(''); setDay(event.target.value); }} /></label>
      <label>Sede<select value={selectedSite} disabled={busy || !choices} onChange={(event) => { setSite(event.target.value); setProfessional(''); setNotice(''); }}><option value="">Seleccione una sede</option>{choices?.sites.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
    </section>
    <section className="booking-panel" aria-labelledby="create-heading"><h2 id="create-heading">Crear cita de demostración</h2>
      <form className="booking-form" onSubmit={(event) => { event.preventDefault(); if (!selectedSite || !selectedProfessional || !selectedPatient || !day) return; void mutate(() => createAppointment({ siteId: selectedSite, professionalId: selectedProfessional, patientId: selectedPatient, startsAt: `${day}T${time}:00Z` }), 'La cita de demostración fue confirmada.'); }}>
        <label>Profesional asignado<select required value={selectedProfessional} disabled={busy || !selectedSite} onChange={(event) => setProfessional(event.target.value)}><option value="">Seleccione un profesional</option>{availableProfessionals.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
        <label>Paciente ficticio<select required value={selectedPatient} disabled={busy || !selectedSite} onChange={(event) => setPatient(event.target.value)}><option value="">Seleccione un paciente ficticio</option>{choices?.patients.map((entry) => <option key={entry.id} value={entry.id}>{entry.label}</option>)}</select></label>
        <label>Horario (UTC, 30 minutos)<select value={time} disabled={busy || !selectedSite} onChange={(event) => setTime(event.target.value)}>{slots.map((slot) => <option key={slot} value={slot}>{slot} UTC</option>)}</select></label>
        <button disabled={busy || loading || !selectedSite || !selectedProfessional || !selectedPatient || !day}>Confirmar cita de demostración</button>
      </form><p className="booking-hint">Los horarios disponibles van de 08:00 a 17:30 UTC. Todavía no se admite la hora local de cada sede.</p>
    </section>
    <section className="booking-panel" aria-labelledby="agenda-heading"><h2 id="agenda-heading">Agenda · {day || 'seleccione un día'} UTC</h2>
      {agendaError && <p role="alert" className="booking-error">{agendaError}</p>}{mutationError && <p role="alert" className="booking-error">{mutationError}</p>}{notice && <p role="status" className="booking-success">{notice}</p>}
      {loading ? <p role="status">Cargando citas de demostración…</p> : !selectedSite ? <p>Seleccione una sede para ver su agenda.</p> : visible.length === 0 ? <p>No hay citas de demostración para esta sede y este día.</p> : <ul className="booking-list">{visible.map((row) => <li key={row.id}><div><strong>{new Date(row.starts_at).toISOString().slice(11, 16)} UTC</strong> · {patientLabel(row.patients)}<p>{choices?.professionals.find((entry) => entry.id === row.professional_id)?.name ?? 'Profesional'} · <span>{row.status === 'cancelled' ? 'Cancelada' : 'Confirmada'}</span></p></div>{row.status === 'confirmed' && <button type="button" disabled={busy} onClick={() => void mutate(() => cancelAppointment(row.id), 'La cita de demostración fue cancelada.')}>Cancelar</button>}</li>)}</ul>}
    </section>
  </main>;
}
