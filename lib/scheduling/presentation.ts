export function patientLabel(patient: unknown): string {
  if (patient && typeof patient === 'object' && !Array.isArray(patient) &&
      'display_label' in patient && typeof patient.display_label === 'string') return patient.display_label;
  return 'Paciente ficticio';
}

export function schedulingMessage(message: string): string {
  switch (message) {
    case 'Slot unavailable.': return 'El horario ya no está disponible.';
    case 'Invalid request.': return 'No se pudo procesar la solicitud.';
    default: return 'El servicio de agenda no está disponible. Inténtelo nuevamente.';
  }
}
