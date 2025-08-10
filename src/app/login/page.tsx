'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import {
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const { user, loading, loginWithMicrosoft } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isCheckingRedirect, setIsCheckingRedirect] = React.useState(true);

  React.useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          // Redirect handled by the main auth context watcher
        }
      })
      .catch((e) => {
        console.error('Redirect result error:', e);
        setError(e.message);
      })
      .finally(() => {
        setIsCheckingRedirect(false);
      });
  }, []);

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [loading, user, router]);

  const handleMicrosoftLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithMicrosoft();
    } catch (e: any) {
      setError(e?.message ?? 'Login failed');
      setSubmitting(false);
    }
  };

  if (loading || isCheckingRedirect || user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

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
