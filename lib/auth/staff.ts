import type { createClient } from '../supabase/server';

type StaffClient = NonNullable<Awaited<ReturnType<typeof createClient>>>;

/** A verified identity and an RLS-visible membership are both required. */
export async function resolveStaff(client: Pick<StaffClient, 'auth' | 'from'>): Promise<{ userId: string; organizationId: string } | null> {
  try {
    const { data: claims, error: authError } = await client.auth.getClaims();
    const userId = claims?.claims?.sub;
    if (authError || typeof userId !== 'string' || !userId) return null;
    const { data, error } = await client.from('memberships').select('organization_id').eq('user_id', userId).limit(1);
    const organizationId = data?.[0]?.organization_id;
    if (error || typeof organizationId !== 'string' || !organizationId) return null;
    return { userId, organizationId };
  } catch {
    return null;
  }
}

/** Server-only DAL entry point for all staff operations, including future booking actions. */
export async function requireStaff() {
  const { redirect } = await import('next/navigation');
  const { createClient: makeClient } = await import('../supabase/server');
  const client = await makeClient();
  if (!client) return redirect('/login');
  const staff = await resolveStaff(client);
  if (!staff) return redirect('/login');
  return { client, ...staff };
}
