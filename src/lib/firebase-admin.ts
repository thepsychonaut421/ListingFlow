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
    const serviceAccountJson = JSON.parse(serviceAccountString);

    admin.initializeApp({
      credential: admin.credential.cert({
        ...serviceAccountJson,
        private_key: serviceAccountJson.private_key.replace(/\\n/g, '\n'),
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
