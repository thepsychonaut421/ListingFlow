'use client'
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required Firebase config values are present
const isFirebaseConfigValid = 
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId;

let app;
if (isFirebaseConfigValid) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
} else {
    console.error("Firebase configuration is invalid or incomplete. Please check your environment variables. Auth features will be disabled.");
}


export const auth = app ? getAuth(app) : null;

// Initialize App Check only on the client-side and if the key is provided
if (typeof window !== 'undefined' && app) {
    const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
    if (siteKey) {
        try {
            initializeAppCheck(app, {
                provider: new ReCaptchaV3Provider(siteKey),
                isTokenAutoRefreshEnabled: true
            });
        } catch (error) {
            console.error("Failed to initialize Firebase App Check:", error);
        }
    } else {
        console.warn('Firebase App Check is not initialized. Missing NEXT_PUBLIC_RECAPTCHA_SITE_KEY.');
    }
}
