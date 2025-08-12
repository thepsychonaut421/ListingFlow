import admin from 'firebase-admin';

let auth: admin.auth.Auth;

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (!serviceAccountString) {
    throw new Error('Firebase service account is not configured. Please set the FIREBASE_SERVICE_ACCOUNT environment variable.');
  }

  try {
    // The service account can be a single-line JSON string.
    const serviceAccount = JSON.parse(serviceAccountString);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

  } catch (e: any) {
    console.error('Failed to parse or initialize Firebase Admin SDK. Make sure the FIREBASE_SERVICE_ACCOUNT is a valid JSON string.', e);
    // Throw an error to stop the application from running with a misconfiguration.
    throw new Error('Firebase Admin SDK initialization failed.');
  }
}

auth = admin.auth();

export { auth };
