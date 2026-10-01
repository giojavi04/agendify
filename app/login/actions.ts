'use server';

import { redirect } from 'next/navigation';
import { createClient } from '../../lib/supabase/server';

export async function signIn(formData: FormData) {
  const email = formData.get('email');
  const password = formData.get('password');
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) redirect('/login?error=1');
  const client = await createClient();
  if (!client) redirect('/login?error=1');
  let signedIn = false;
  try {
    const { error } = await client.auth.signInWithPassword({ email, password });
    signedIn = !error;
  } catch {
    // Keep provider errors and credentials out of the response.
  }
  if (!signedIn) redirect('/login?error=1');
  redirect('/dashboard');
}
