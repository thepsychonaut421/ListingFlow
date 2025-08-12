'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { createSession } from '@/app/login/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AuthActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = React.useState('Verifying...');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const processSignIn = async () => {
      const auth = getAuth(app);
      const emailLink = window.location.href;

      if (isSignInWithEmailLink(auth, emailLink)) {
        let email = window.localStorage.getItem('emailForSignIn');
        if (!email) {
          // User opened the link on a different device. To prevent session
          // fixation attacks, ask the user to provide the email again.
          // For simplicity here, we'll show an error.
          setError('Email not found. Please try signing in on the same device.');
          setStatus('Verification Failed');
          return;
        }

        try {
          const result = await signInWithEmailLink(auth, email, emailLink);
          const idToken = await result.user.getIdToken();
          
          setStatus('Creating session...');
          const sessionResult = await createSession(idToken);

          if (sessionResult.error) {
            throw new Error(sessionResult.error);
          }
          
          window.localStorage.removeItem('emailForSignIn');
          setStatus('Redirecting...');
          router.push('/');
        } catch (err: any) {
          console.error(err);
          setError(`Sign-in failed: ${err.message}`);
          setStatus('Verification Failed');
          toast({
            variant: 'destructive',
            title: 'Sign-in Failed',
            description: err.message,
          });
        }
      } else {
        setError('Invalid sign-in link.');
        setStatus('Verification Failed');
      }
    };

    processSignIn();
  }, [router, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
        <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-lg">{status}</p>
        </div>
        {error && <p className="mt-4 text-destructive">{error}</p>}
    </div>
  );
}
