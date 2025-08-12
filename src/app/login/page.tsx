'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Package, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInWithEmailLink,
} from 'firebase/auth';
import { app } from '@/lib/firebase';

type AuthMode = 'signin' | 'signup';

function AuthForm() {
  const [mode, setMode] = React.useState<AuthMode>('signin');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLinkSubmitting, setIsLinkSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth(app);

  const handlePasswordSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      router.push('/');
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      let friendlyMessage = 'An unknown error occurred. Please try again.';
      if (err.code) {
        switch (err.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            friendlyMessage = 'Invalid email or password. Please try again.';
            break;
          case 'auth/email-already-in-use':
            friendlyMessage = 'This email is already in use. Please sign in or use a different email.';
            break;
          case 'auth/weak-password':
            friendlyMessage = 'The password is too weak. It must be at least 6 characters long.';
            break;
          default:
            friendlyMessage = err.message;
        }
      }
      setError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLinkSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setIsLinkSubmitting(true);
      setError(null);
      
      const emailInput = document.getElementById('email') as HTMLInputElement;
      const email = emailInput?.value;
      
      if(!email) {
          setError('Please enter your email address to receive a link.');
          setIsLinkSubmitting(false);
          return;
      }

      const actionCodeSettings = {
        url: `${window.location.origin}/auth/action`,
        handleCodeInApp: true,
      };
      
      try {
        await sendSignInWithEmailLink(auth, email, actionCodeSettings);
        window.localStorage.setItem('emailForSignIn', email);
        toast({
          title: 'Check your email',
          description: 'A sign-in link has been sent to your email address.',
        });
      } catch (err: any) {
        console.error('Send Link Error:', err);
        setError(err.message);
      } finally {
        setIsLinkSubmitting(false);
      }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <div className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
            <Package className="h-6 w-6 transition-all group-hover:scale-110" />
            <span className="sr-only">ListingFlow</span>
          </div>
        </div>
        <CardTitle className="text-2xl">
          {mode === 'signin' ? 'Welcome Back' : 'Create an Account'}
        </CardTitle>
        <CardDescription>
          {mode === 'signin' ? 'Enter your credentials to access your dashboard.' : 'Fill in the details below to get started.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handlePasswordSubmit}>
        <CardContent className="space-y-4">
           {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="me@example.com"
              required
              disabled={isSubmitting || isLinkSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              disabled={isSubmitting || isLinkSubmitting}
            />
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" aria-disabled={isSubmitting} disabled={isSubmitting || isLinkSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
          
          <div className="relative w-full flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
              </div>
          </div>
          
           <Button variant="outline" className="w-full" onClick={handleLinkSubmit} disabled={isSubmitting || isLinkSubmitting}>
               {isLinkSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
               Sign in with Email Link
          </Button>
          
          <Button variant="link" type="button" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(null); }} disabled={isSubmitting || isLinkSubmitting}>
            {mode === 'signin' ? 'Don\'t have an account? Sign Up' : 'Already have an account? Sign In'}
          </Button>

        </CardFooter>
      </form>
    </Card>
  );
}


export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
        <AuthForm />
    </div>
  );
}
