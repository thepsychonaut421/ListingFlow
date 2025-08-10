'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  OAuthProvider,
  signInWithRedirect,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = React.useState(true);
  const redirected = React.useRef(false);

  // 1) Procesează rezultatul după revenirea din redirect
  React.useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user && !redirected.current) {
            redirected.current = true;
            router.replace('/'); 
        }
      })
      .catch((e) => {
        console.error('Redirect result error:', e);
        setError(e.message);
      })
      .finally(() => {
        setIsCheckingRedirect(false);
      });
  }, [router]);

  // 2) Dacă userul e deja logat (din onAuthStateChanged în context), mergi direct în app
  React.useEffect(() => {
    if (!loading && user && !redirected.current) {
        redirected.current = true;
        router.replace('/');
    }
  }, [loading, user, router]);

  // 3) Buton login: popup -> fallback la redirect
  const handleMicrosoftLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const provider = new OAuthProvider('microsoft.com');

      const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      if (!tenant || tenant === 'your-tenant-id') {
        throw new Error('FATAL: Microsoft Tenant ID is not configured in environment variables.');
      }
      provider.setCustomParameters({ tenant, prompt: 'select_account' });
      
      try {
        await signInWithPopup(auth, provider);
        // onAuthStateChanged va gestiona redirectarea
      } catch (e: any) {
        if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
          await signInWithRedirect(auth, provider);
        } else {
          throw e;
        }
      }

    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
      setSubmitting(false);
    }
  };

  if (loading || isCheckingRedirect) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  // Afișează pagina de login doar dacă nu e logat și nu se încarcă
  if (!user) {
    return (
        <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border p-6 space-y-6">
            <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Login to ListingFlow</h1>
            <p className="text-sm text-muted-foreground">
                Sign in using your Microsoft 365 account.
            </p>
            </div>

            <button
            onClick={handleMicrosoftLogin}
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-md border px-4 py-2"
            >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Sign in with Microsoft
            </button>

            {error && (
            <div className="text-sm text-red-600 border border-red-200 rounded-md p-2">
                {error}
            </div>
            )}
        </div>
        </div>
    );
  }

  // Dacă userul e încărcat și suntem pe această pagină, e o stare tranzitorie, arătăm loading.
  return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting...</span>
        </div>
      </div>
    );
}
