'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { app } from '@/lib/firebase';
import { createSession } from '@/app/login/actions';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function AuthActionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = React.useState('Verifying sign-in link...');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const processSignIn = async () => {
      const auth = getAuth(app);
      const emailLink = window.location.href;

      if (!isSignInWithEmailLink(auth, emailLink)) {
        setError('Invalid or expired sign-in link. Please request a new one.');
        setStatus('Verification Failed');
        return;
      }

      let email = window.localStorage.getItem('emailForSignIn');
      if (!email) {
        // This can happen if the user opens the link on a different browser or device.
        // For security reasons, we ask for the email again.
        // A more robust solution might use a prompt, but for now, we'll show an error.
        email = window.prompt('Please provide your email for confirmation');
        if (!email) {
          setError('Email is required to complete the sign-in process.');
          setStatus('Verification Failed');
          return;
        }
      }

      try {
        setStatus('Confirming email...');
        const result = await signInWithEmailLink(auth, email, emailLink);
        const idToken = await result.user.getIdToken();
        
        setStatus('Creating your secure session...');
        const sessionResult = await createSession(idToken);

        if (sessionResult.error) {
          throw new Error(sessionResult.error);
        }
        
        // Clean up the stored email
        window.localStorage.removeItem('emailForSignIn');
        
        setStatus('Redirecting to your dashboard...');
        // A small delay to allow the user to read the message.
        setTimeout(() => {
            router.push('/');
        }, 500);

      } catch (err: any) {
        console.error('Sign-in link error:', err);
        setError(`Sign-in failed: ${err.message}. Please try again.`);
        setStatus('Verification Failed');
        toast({
          variant: 'destructive',
          title: 'Sign-in Failed',
          description: 'The link may be invalid, expired, or you may need to request it from the same device.',
        });
      }
    };

    processSignIn();
  }, [router, toast]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center p-4">
        <div className="flex items-center space-x-2">
            {!error && <Loader2 className="h-6 w-6 animate-spin" />}
            <p className="text-lg font-medium">{status}</p>
        </div>
        {error && <p className="mt-4 text-destructive bg-destructive/10 p-4 rounded-md">{error}</p>}
    </div>
  );
}
