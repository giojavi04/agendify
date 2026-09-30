import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agendify · Vista de demostración',
  description: 'Vista ficticia de agenda. No contiene datos reales de pacientes.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="es"><body>{children}</body></html>;
}
