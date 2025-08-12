import admin from 'firebase-admin';

let auth: admin.auth.Auth;

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!serviceAccountString) {
    throw new Error(
      'Firebase service account is not configured. Please set the FIREBASE_SERVICE_ACCOUNT environment variable.'
    );
  }

  try {
    // The service account from env vars might have escaped newlines.
    // We need to parse it correctly.
    const serviceAccountJson = JSON.parse(serviceAccountString);
    
    // The private key specifically needs its escaped newlines replaced with actual newlines.
    const privateKey = serviceAccountJson.private_key.replace(/\\n/g, '\n');

    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccountJson,
        private_key: privateKey,
      }),
    });
  } catch (e: any) {
    console.error(
      'Failed to parse or initialize Firebase Admin SDK. Ensure FIREBASE_SERVICE_ACCOUNT is a valid, single-line JSON string in your .env file.',
      e
    );
    throw new Error('Firebase Admin SDK initialization failed.');
  }
}

auth = admin.auth();

export { auth };
