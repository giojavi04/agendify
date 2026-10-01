import { signIn } from './actions';

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col bg-agendify-canvas font-agendify text-agendify-ink lg:flex-row">
      <section className="flex flex-col justify-between gap-8 bg-agendify-deep px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:w-1/2 lg:px-16 lg:py-14">
        <div className="flex items-center gap-3 text-2xl font-extrabold tracking-tight">
          <span aria-hidden="true" className="grid size-11 place-items-center rounded-xl bg-agendify-mint text-agendify-deep">A</span>
          Agendify
        </div>
        <div className="max-w-lg lg:py-12">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-agendify-mint">Espacio del equipo</p>
          <p className="m-0 text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">Tu agenda, en un solo lugar.</p>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">Ingresá para gestionar las citas de demostración de tu equipo.</p>
        </div>
        <p className="m-0 text-sm text-white/75">Entorno de demostración · Datos sintéticos</p>
      </section>
      <section className="flex flex-1 items-center justify-center px-5 py-10 sm:px-10 lg:py-16">
        <div className="w-full max-w-md rounded-2xl border border-agendify-ink/10 bg-white p-6 shadow-xl shadow-agendify-ink/10 sm:p-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-agendify-deep">Acceso del equipo</p>
          <h1 className="mt-0 mb-3 text-3xl font-bold tracking-tight">Bienvenido de nuevo</h1>
          <p className="mb-6 leading-relaxed">Solo personal autorizado. No ingreses datos reales de pacientes. Esta demo usa únicamente datos sintéticos.</p>
          {error === '1' && <p role="alert" className="mb-5 rounded-lg border border-amber-600 bg-amber-50 p-3 font-semibold text-amber-950">No se pudo iniciar sesión.</p>}
          <form action={signIn} className="grid gap-5">
            <label className="grid gap-2 font-semibold">Correo electrónico
              <input className="min-h-11 w-full rounded-lg border border-agendify-ink/40 bg-white px-3 py-2 font-normal text-agendify-ink" name="email" type="email" autoComplete="username" required />
            </label>
            <label className="grid gap-2 font-semibold">Contraseña
              <input className="min-h-11 w-full rounded-lg border border-agendify-ink/40 bg-white px-3 py-2 font-normal text-agendify-ink" name="password" type="password" autoComplete="current-password" required />
            </label>
            <button className="min-h-11 w-full cursor-pointer rounded-lg bg-agendify-deep px-5 py-3 font-bold text-white hover:bg-agendify-ink" type="submit">Ingresar</button>
          </form>
        </div>
      </section>
    </main>
  );
}
