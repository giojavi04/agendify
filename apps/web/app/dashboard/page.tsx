import { requireStaff } from '../../lib/auth/staff';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  await requireStaff();
  return <main><h1>Espacio del equipo</h1><p>Acceso autorizado. Esta versión no admite datos reales de pacientes ni gestiona turnos.</p></main>;
}
