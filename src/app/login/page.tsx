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
  const router = useRouter();
  const { toast } = useToast();
  const [isMicrosoftLoading, setIsMicrosoftLoading] = React.useState(true); // Start loading
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // First, check for redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('[Login] Redirect result processed. User found.');
          router.replace('/dashboard');
        } else {
          // If no redirect result, set up auth state listener
          const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
              console.log('[Login] Auth state changed. User found.');
              router.replace('/dashboard');
            } else {
              // No user, ready for login
              setIsMicrosoftLoading(false);
              console.log('[Login] No user session found. Ready to log in.');
            }
          });
          return () => unsubscribe();
        }
      })
      .catch((error) => {
        console.error('Login error during redirect check:', error);
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message || 'An unexpected error occurred.',
        });
        setIsMicrosoftLoading(false);
      });
  }, [router, toast]);

  const handleMicrosoftLogin = async () => {
    setIsMicrosoftLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);
      const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      if (!tenantId) {
        throw new Error(
          'Microsoft Tenant ID is not configured. Please set NEXT_PUBLIC_MICROSOFT_TENANT_ID in your environment variables.'
        );
      }
      const provider = new OAuthProvider('microsoft.com');
      // This is the correct way to specify a tenant for Microsoft auth
      provider.setCustomParameters({
        tenant: tenantId,
      });

      // Try popup first, which is a better UX
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the redirect
    } catch (error: any) {
      // Fallback to redirect if popup is blocked
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
        if (!tenantId) {
            // This case should be caught by the check above, but we repeat for safety
            toast({ variant: 'destructive', title: 'Configuration Error', description: 'Microsoft Tenant ID is not configured.'});
            setIsMicrosoftLoading(false);
            return;
        }
        const provider = new OAuthProvider('microsoft.com');
        provider.setCustomParameters({
            tenant: tenantId,
        });
        await signInWithRedirect(auth, provider);
      } else {
        console.error('Microsoft login error:', error);
        toast({
          variant: 'destructive',
          title: 'Microsoft Login Failed',
          description:
            error.message ||
            'Could not sign in with Microsoft. Please try again.',
        });
        setIsMicrosoftLoading(false);
      }
    }
  };
  
  if (isMicrosoftLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
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
            Please sign in using your company&apos;s Microsoft account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <Button
              variant="outline"
              onClick={handleMicrosoftLogin}
              disabled={isMicrosoftLoading}
            >
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
}
