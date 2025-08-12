'use server';

import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function sendSignInLink(email: string) {
  if (!email) {
    return { error: 'Email is required.' };
  }
  
  const actionCodeSettings = {
    url: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/action`,
    handleCodeInApp: true,
  };

  try {
    await auth.generateSignInWithEmailLink(email, actionCodeSettings);
    return { success: true };
  } catch (error: any) {
    console.error('Error generating sign-in link:', error);
    return { error: error.message || 'Could not send sign-in link.' };
  }
}

export async function createSession(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    try {
        const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
        cookies().set('session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
        });
        return { success: true };
    } catch (error) {
        console.error('Error creating session cookie', error);
        return { error: 'Could not create session.' };
    }
}

export async function logout() {
  cookies().delete('session');
  redirect('/login');
}
