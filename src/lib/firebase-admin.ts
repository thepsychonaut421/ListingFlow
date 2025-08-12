import admin from 'firebase-admin';
import 'firebase/auth'; // Required for auth related operations on admin

let auth: admin.auth.Auth;
let db: admin.firestore.Firestore;

if (!admin.apps.length) {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountString) {
    try {
      const serviceAccount = JSON.parse(serviceAccountString);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      auth = admin.auth();
      db = admin.firestore();
    } catch (e: any) {
      console.error('Failed to parse or initialize Firebase Admin SDK from FIREBASE_SERVICE_ACCOUNT:', e.message);
      // Throw an error or handle it gracefully, so `auth` and `db` are not used when uninitialized.
      // For this case, we'll let them be undefined and the caller should handle it.
    }
  } else {
    console.warn('FIREBASE_SERVICE_ACCOUNT environment variable is not set. Firebase Admin SDK could not be initialized. Some server-side functionality will not work.');
  }
} else {
    auth = admin.auth();
    db = admin.firestore();
}

// @ts-ignore - We are exporting potentially uninitialized variables, callers must handle this.
export { auth, db };
