import { signIn } from './actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main><h1>Acceso del equipo</h1><p>Solo personal autorizado. No ingreses datos reales de pacientes.</p>
    {error === '1' && <p role="alert">No se pudo iniciar sesión.</p>}
    <form action={signIn}><label>Correo electrónico <input name="email" type="email" autoComplete="username" required /></label>
      <label>Contraseña <input name="password" type="password" autoComplete="current-password" required /></label>
      <button type="submit">Ingresar</button></form></main>;
}
