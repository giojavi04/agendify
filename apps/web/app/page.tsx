import { demo } from '../lib/demo';

export default function Home() {
  return (
    <div className="shell">
      <aside className="sidebar" aria-label="Identidad de la demostración">
        <a className="brand" href="#inicio" aria-label="Agendify, ir al inicio"><span className="brand-icon" aria-hidden="true">✦</span> agendify<span className="brand-dot">.</span></a>
        <div className="sidebar-body"><span className="eyebrow">ESPACIO DEMO</span><p>Una agenda más clara para cada día.</p><div className="sidebar-art" aria-hidden="true"><span>✳</span><span>✦</span><span>✳</span></div></div>
        <p className="sidebar-footer">Una vista de lo que podría ser.<br />Sin conexión ni datos reales.</p>
      </aside>
      <main id="inicio" className="content">
        <header className="topbar"><div><span className="eyebrow">AGENDIFY / DEMOSTRACIÓN</span><p className="workspace">{demo.workspace}</p></div><span className="demo-pill">✦ &nbsp; Modo demo</span></header>
        <div className="main-inner">
          <div className="notice" role="note"><span className="notice-icon" aria-hidden="true">ⓘ</span><p><strong>Demo: no ingresar datos reales de pacientes.</strong> Esta pantalla utiliza únicamente nombres y turnos ficticios. No permite gestionar turnos ni está conectada a un servicio.</p></div>
          <section className="welcome" aria-labelledby="welcome-title"><div><span className="eyebrow">TU ESPACIO DE TRABAJO</span><h1 id="welcome-title">Un día bien organizado<br /><em>empieza acá.</em></h1><p>Una vista simple de tu agenda, tus profesionales y lo que viene.</p></div><div className="welcome-decoration" aria-hidden="true"><span>✳</span></div></section>
          <section className="overview" aria-labelledby="overview-title"><div className="section-heading"><div><span className="eyebrow">DE UN VISTAZO</span><h2 id="overview-title">Resumen del día</h2></div><span className="date-badge">{demo.dateLabel} · fecha ficticia</span></div><div className="metric-grid">{demo.metrics.map((metric, index) => <article className="metric" key={metric.label}><span className="metric-icon" aria-hidden="true">{['◷', '✳', '⌂'][index]}</span><p className="metric-label">{metric.label}</p><p className="metric-value">{metric.value}</p><p className="metric-detail">{metric.detail}</p></article>)}</div></section>
          <section className="schedule" aria-labelledby="schedule-title"><div className="section-heading"><div><span className="eyebrow">AGENDA FICTICIA</span><h2 id="schedule-title">Próximos turnos</h2></div><span className="preview-label">Vista previa · 4 de 8 ejemplos</span></div><div className="appointment-list">{demo.appointments.map((appointment) => <article className="appointment" key={`${appointment.time}-${appointment.patient}`}><div className="time"><strong>{appointment.time}</strong><span>{appointment.end}</span></div><span className="avatar" aria-hidden="true">{appointment.initials}</span><div className="appointment-info"><h3>{appointment.patient}</h3><p>{appointment.service} <span aria-hidden="true">·</span> {appointment.professional}</p></div><div className="appointment-side"><span className={`status ${appointment.status === 'Pendiente' ? 'pending' : ''}`}>{appointment.status}</span><small>{appointment.site}</small></div></article>)}</div><p className="schedule-footnote">Estos turnos son ejemplos estáticos. No representan reservas existentes.</p></section>
          <footer className="footer">Agendify · Prototipo visual con datos ficticios. No apto para uso clínico.</footer>
        </div>
      </main>
    </div>
  );
}
