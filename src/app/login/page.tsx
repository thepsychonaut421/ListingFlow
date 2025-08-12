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
import { sendSignInLink, signInWithEmailAndPassword, signUpWithEmailAndPassword } from './actions';
import { useRouter } from 'next/navigation';

type AuthMode = 'signin' | 'signup' | 'link';

function AuthForm() {
  const [mode, setMode] = React.useState<AuthMode>('signin');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    let result;
    try {
        if (mode === 'signin') {
            result = await signInWithEmailAndPassword(email, password);
        } else if (mode === 'signup') {
            result = await signUpWithEmailAndPassword(email, password);
        } else {
            result = await sendSignInLink(email);
            if (!result?.error) {
                 window.localStorage.setItem('emailForSignIn', email);
                 toast({
                    title: 'Check your email',
                    description: 'A sign-in link has been sent to your email address.',
                });
            }
        }
    } catch (err: any) {
        result = { error: err.message || 'An unexpected error occurred.' };
    }


    setIsSubmitting(false);

    if (result?.error) {
      toast({
        variant: 'destructive',
        title: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Failed`,
        description: result.error,
      });
    } else if (mode !== 'link') {
        // Successful sign-in or sign-up redirects via page reload.
        router.push('/');
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <div className="flex justify-center items-center mb-4">
          <div className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base">
            <Package className="h-6 w-6 transition-all group-hover:scale-110" />
            <span className="sr-only">ListingFlow</span>
          </div>
        </div>
        <CardTitle className="text-2xl">Welcome to ListingFlow</CardTitle>
        <CardDescription>
          {mode === 'signin' && 'Enter your credentials to access your account.'}
          {mode === 'signup' && 'Create a new account to get started.'}
          {mode === 'link' && 'Enter your email below to receive a sign-in link.'}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="me@example.com"
              required
              disabled={isSubmitting}
            />
          </div>
          {mode !== 'link' && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                disabled={isSubmitting}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <Button type="submit" className="w-full" aria-disabled={isSubmitting} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === 'signin' && 'Sign In'}
            {mode === 'signup' && 'Sign Up'}
            {mode === 'link' && 'Send Sign-in Link'}
          </Button>
          <div className='flex justify-between w-full'>
             <Button variant="link" type="button" onClick={() => setMode(mode === 'link' ? 'signin' : 'link')} disabled={isSubmitting}>
                {mode === 'link' ? 'Sign in with password' : 'Sign in with email link'}
            </Button>
             <Button variant="link" type="button" onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')} disabled={isSubmitting}>
                {mode === 'signin' ? 'Create an account' : 'Already have an account?'}
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}


export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <AuthForm />
    </div>
  );
}
