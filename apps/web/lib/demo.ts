// Fictional, immutable presentation fixtures. No patient or clinical records.
export const demo = {
  workspace: 'Centro Aurora · espacio de demostración',
  dateLabel: 'Martes 13 de octubre',
  metrics: [
    { label: 'Turnos de ejemplo', value: '08', detail: 'En esta vista ficticia' },
    { label: 'Profesionales', value: '03', detail: 'Perfiles inventados' },
    { label: 'Sedes de muestra', value: '02', detail: 'Sin ubicaciones reales' },
  ],
  appointments: [
    { time: '09:00', end: '09:30', initials: 'PA', patient: 'Persona Alfa', service: 'Consulta de muestra', professional: 'Dra. Sol Rivera', site: 'Sede Horizonte', status: 'Confirmado' },
    { time: '10:30', end: '11:00', initials: 'PB', patient: 'Persona Beta', service: 'Control de muestra', professional: 'Dr. Nico Prado', site: 'Sede Horizonte', status: 'Confirmado' },
    { time: '12:00', end: '12:30', initials: 'PG', patient: 'Persona Gamma', service: 'Consulta de muestra', professional: 'Dra. Luz Campos', site: 'Sede Brisa', status: 'Pendiente' },
    { time: '15:00', end: '15:30', initials: 'PD', patient: 'Persona Delta', service: 'Control de muestra', professional: 'Dra. Sol Rivera', site: 'Sede Horizonte', status: 'Confirmado' },
  ],
} as const;
