'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  getRedirectResult,
  OAuthProvider,
  setPersistence,
  signInWithRedirect,
  browserLocalPersistence,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

const MicrosoftIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    className="mr-2"
    viewBox="0 0 16 16"
  >
    <path d="M7.462 0H0v7.462h7.462V0zM16 0H8.538v7.462H16V0zM7.462 8.538H0V16h7.462V8.538zM16 8.538H8.538V16H16V8.538z" />
  </svg>
);

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = React.useState(true); // Start as true to handle redirect check

  // Check for redirect result on component mount
  React.useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          router.replace('/dashboard');
        } else {
            setIsLoggingIn(false); // No user from redirect, allow login attempt
        }
      })
      .catch((e) => {
        console.error(
          'getRedirectResult error:',
          e,
          e?.customData,
          e?.customData?._tokenResponse
        );
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: e?.message ?? 'An unknown error occurred during redirect.',
        });
        setIsLoggingIn(false);
      });
  // This should only run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  React.useEffect(() => {
    // This effect handles users who are already logged in and land on this page
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      
      if (!tenantId) {
        throw new Error('Microsoft Tenant ID is not configured.');
      }
      
      const provider = new OAuthProvider('microsoft.com');
      provider.setCustomParameters({
        tenant: tenantId,
        prompt: 'select_account',
      });
      
      // DEBUG:
      // @ts-ignore
      const __dbg = (auth as any);
      const authDomain = __dbg?.app?.options?.authDomain;
      const apiKey     = __dbg?.app?.options?.apiKey;
      const projectId  = __dbg?.app?.options?.projectId;

      console.log('[AUTH DBG]', {
        location: window.location.origin,
        authDomain,
        projectId,
        hasApiKey: Boolean(apiKey),
      });
      
      // Force redirect flow to avoid popup issues
      await signInWithRedirect(auth, provider);

    } catch (error: any) {
      console.error('Microsoft login initiation error:', error);
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: error?.message ?? 'An unknown error occurred.',
      });
      setIsLoggingIn(false);
    }
  };

  // While auth state is loading from context, or if we are processing login
  if (loading || isLoggingIn) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Package className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl">Login to ListingFlow</CardTitle>
          <CardDescription>
            Please sign in using your company&apos;s Microsoft account to
            continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button
              variant="outline"
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
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
}
