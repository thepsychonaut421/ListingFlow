'use server';

import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getAuth } from 'firebase-admin/auth';

async function createSessionCookie(idToken: string) {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });
    cookies().set('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
    });
}

export async function signUpWithEmailAndPassword(email: string, password: string) {
  try {
    const userRecord = await auth.createUser({
      email,
      password,
    });
    // We need to create a custom token to then get an ID token for the new user
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // To get an ID token, we need to sign in with the custom token on the client side.
    // However, for a server-action based flow, we'll just create the user and ask them to log in.
    // A more complex flow could pass the custom token to the client.
    
    // For now, just creating the user is enough. They can log in immediately after.
    return { success: true, userId: userRecord.uid };
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { error: error.message || 'Could not sign up.' };
  }
}

export async function signInWithEmailAndPassword(email: string, password: string) {
   // This is a workaround since we can't use the client-side SDK directly in server actions.
   // We use the Firebase Auth REST API to verify the password.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY; 
  const restApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  try {
    const response = await fetch(restApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Authentication failed.');
    }

    await createSessionCookie(result.idToken);

    return { success: true };
  } catch (error: any) {
    console.error('Error signing in:', error);
    return { error: error.message || 'Could not sign in.' };
  }
}


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
    try {
        await createSessionCookie(idToken);
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