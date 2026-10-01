import { requireStaff } from '../../lib/auth/staff';
import BookingClient from './booking-client';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  await requireStaff();
  return <BookingClient />;
}
