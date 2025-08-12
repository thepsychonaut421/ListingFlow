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

// Helper to get the Firebase Auth REST API key, ensuring it's set.
function getFirebaseApiKey(): string {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  if (!apiKey) {
    throw new Error('Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is not configured in environment variables.');
  }
  return apiKey;
}

export async function signUpWithEmailAndPassword(email: string, password: string) {
  try {
    // 1. Create the user using the Admin SDK
    const userRecord = await auth.createUser({ email, password });
    
    // 2. Immediately sign in the user by creating a custom token and exchanging it for an ID token
    const customToken = await auth.createCustomToken(userRecord.uid);
    const apiKey = getFirebaseApiKey();
    
    const idTokenResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    });

    const idTokenResult = await idTokenResponse.json();
    if (!idTokenResponse.ok) {
        // If the exchange fails, delete the created user to allow them to try again.
        await auth.deleteUser(userRecord.uid);
        throw new Error(idTokenResult.error?.message || 'Could not exchange custom token for ID token.');
    }

    // 3. Create the session cookie
    await createSessionCookie(idTokenResult.idToken);
    return { success: true };
    
  } catch (error: any) {
    console.error('Error signing up:', error);
    // Return a more user-friendly error message
    return { error: error.code?.includes('email-already-exists') ? 'This email is already in use.' : (error.message || 'Could not sign up.') };
  }
}

export async function signInWithEmailAndPassword(email: string, password: string) {
  try {
    const apiKey = getFirebaseApiKey();
    const restApiUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const response = await fetch(restApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    });

    const result = await response.json();
    if (!response.ok) {
      // Provide a clearer error message for common authentication failures
      if (result.error?.message === 'INVALID_LOGIN_CREDENTIALS') {
        throw new Error('Invalid email or password. Please try again.');
      }
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
