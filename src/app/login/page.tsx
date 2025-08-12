
'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';
import { useActionState } from 'react';
import { login } from './actions';
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

function LoginButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="w-full" aria-disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Sign In
    </Button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: state.error,
      });
    }
  }, [state, toast]);


  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
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
            Enter the application password to access the dashboard.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                    id="password"
                    name="password"
                    type="password"
                    required
                    />
                </div>
                 {state?.error && (
                    <p className="text-sm text-destructive">{state.error}</p>
                )}
            </CardContent>
            <CardFooter>
                <LoginButton />
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
