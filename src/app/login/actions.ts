'use server';

import { auth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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
    // After creating the user, we sign them in immediately to create a session.
    // This provides a smoother user experience than asking them to log in again.
    const customToken = await auth.createCustomToken(userRecord.uid);
    
    // Exchange custom token for an ID token on the client side via REST API
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) {
      // This should not happen if the environment is set up correctly
      throw new Error('Firebase API Key is not configured.');
    }
    
    const idTokenResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });

    const idTokenResult = await idTokenResponse.json();
    if (!idTokenResponse.ok) {
        throw new Error(idTokenResult.error?.message || 'Could not exchange custom token for ID token.');
    }

    await createSessionCookie(idTokenResult.idToken);
    return { success: true, userId: userRecord.uid };
    
  } catch (error: any) {
    console.error('Error signing up:', error);
    return { error: error.message || 'Could not sign up.' };
  }
}

export async function signInWithEmailAndPassword(email: string, password: string) {
   // This is the correct way to sign in with password in a server action.
   // We use the Firebase Auth REST API to verify the password.
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY; 
  if (!apiKey) {
    return { error: 'Firebase API Key is not configured.' };
  }
  const restApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

  try {
    const response = await fetch(restApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error?.message || 'Authentication failed. Please check your credentials.');
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
    // URL must be absolute and have a proper domain.
    // NEXT_PUBLIC_BASE_URL should be set in your environment variables.
    url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9002'}/auth/action`,
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