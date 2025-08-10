"use client";

import * as React from 'react';
<<<<<<<<< Temporary merge branch 1
import { useRouter } from 'next/navigation';
import {
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
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
=========
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Package } from 'lucide-react';

const MicrosoftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="mr-2" viewBox="0 0 16 16">
        <path d="M7.462 0H0v7.462h7.462V0zM16 0H8.538v7.462H16V0zM7.462 8.538H0V16h7.462V8.538zM16 8.538H8.538V16H16V8.538z"/>
    </svg>
)

export default function LoginPage() {
  const [isMicrosoftLoading, setIsMicrosoftLoading] = React.useState(false);
  const { user, loginWithMicrosoft } = useAuth();
>>>>>>>>> Temporary merge branch 2
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

<<<<<<<<< Temporary merge branch 1
  // 1) Procesează rezultatul după revenirea din redirect
  React.useEffect(() => {
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user) {
          router.replace(next);
        }
      })
      .catch((e) => console.debug("[AUTH DBG] getRedirectResult error", e));
  }, [next, router]);

  // 2) Dacă userul e deja logat (din onAuthStateChanged în context), mergi direct în app
  React.useEffect(() => {
    if (!loading && user && !redirected.current) {
        redirected.current = true;
        router.replace('/');
=========
  React.useEffect(() => {
    if (user) {
      const nextUrl = searchParams.get('next') || '/';
      router.push(nextUrl);
>>>>>>>>> Temporary merge branch 2
    }
  }, [user, router, searchParams]);

<<<<<<<<< Temporary merge branch 1
  // 3) Buton login: popup -> fallback la redirect
=========
>>>>>>>>> Temporary merge branch 2
  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      if (!tenant || tenant === "your-tenant-id") {
        throw new Error("Microsoft Tenant ID is missing in env variables.");
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
=========
        await loginWithMicrosoft();
        // The useEffect above will handle the redirect on user state change.
    } catch(error: any) {
        toast({
            variant: 'destructive',
            title: 'Microsoft Login Failed',
            description: error.message || 'Could not sign in with Microsoft. Please try again.',
        });
    } finally {
        setIsMicrosoftLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center mb-4">
               <Package className="h-8 w-8" />
            </div>
          <CardTitle className="text-2xl">Login to ListingFlow</CardTitle>
          <CardDescription>
            Please sign in using your company&apos;s Microsoft account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button variant="outline" onClick={handleMicrosoftLogin} disabled={isMicrosoftLoading}>
                {isMicrosoftLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <MicrosoftIcon />
                )}
                Sign in with Microsoft
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
>>>>>>>>> Temporary merge branch 2
}
