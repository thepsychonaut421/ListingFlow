
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function login(prevState: { error: string } | null, formData: FormData) {
  const password = formData.get('password');

  if (password === process.env.APP_PASSWORD) {
    const cookieStore = cookies();
    cookieStore.set('session', 'true', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7, // One week
        path: '/',
    });
    redirect('/');
  } else {
    return { error: 'Invalid password.' };
  }
}

export async function logout() {
    cookies().delete('session');
    redirect('/login');
}
