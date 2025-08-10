'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { OAuthProvider, signInWithRedirect, getRedirectResult, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user } = useAuth();
  const handledRef = useRef(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      if (handledRef.current) return;
      handledRef.current = true;

      await setPersistence(auth, browserLocalPersistence);

      const res = await getRedirectResult(auth).catch((e) => {
        console.error('[Login] getRedirectResult error:', e);
        setError(e?.message ?? 'Login failed.');
        return null;
      });

      if (res?.user) {
        router.replace('/listings');
        return;
      }

      if (user) router.replace('/listings');
    })();
  }, [router, user]);

  const handleMicrosoftLogin = async () => {
    try {
      setError(null);
      setSubmitting(true);
      const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      if (!tenant) throw new Error('Missing NEXT_PUBLIC_MICROSOFT_TENANT_ID');

      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({ tenant, prompt: 'select_account' });

      await setPersistence(auth, browserLocalPersistence);
      await signInWithRedirect(auth, provider);
    } catch (e: any) {
      console.error('Sign-in redirect failed:', e);
      setError(e?.message ?? 'Login failed.');
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Redirecting…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Login to ListingFlow</h1>
          <p className="text-sm text-muted-foreground">Sign in using your Microsoft 365 account.</p>
        </div>
        <button onClick={handleMicrosoftLogin} className="w-full inline-flex items-center justify-center rounded-md border px-4 py-2">
          {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Sign in with Microsoft
        </button>
        {error && <div className="text-sm text-red-600 border border-red-200 rounded-md p-2">{error}</div>}
      </div>
    </div>
  );
}