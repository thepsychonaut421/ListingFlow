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
    // Replace newline characters with literal \n to handle multi-line env vars
    const parsedString = serviceAccountString.replace(/\\n/g, '\n');
    const serviceAccount = JSON.parse(parsedString);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
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
