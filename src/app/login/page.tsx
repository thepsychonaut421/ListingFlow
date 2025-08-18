'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

function EmailForm({ onSubmit }: { onSubmit: (e: string, p: string) => void }) {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  return (
    <form onSubmit={(ev) => { ev.preventDefault(); onSubmit(email, pass); }} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" required value={pass} onChange={e => setPass(e.target.value)} />
      </div>
      <Button type="submit" className="w-full">Sign in</Button>
    </form>
  );
}

export default function LoginPage() {
  const { user, loading, loginGoogle, loginMicrosoft, loginEmail } = useAuth();
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || user) {
    return null; // Or a loading spinner
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                Choose your preferred sign-in method to continue.
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <div className="grid grid-cols-2 gap-6">
                <Button variant="outline" onClick={() => loginGoogle().catch(e => setErr(e.message))}>
                    Google
                </Button>
                <Button variant="outline" onClick={() => loginMicrosoft().catch(e => setErr(e.message))}>
                    Microsoft
                </Button>
                </div>
                <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                    </span>
                </div>
                </div>
                <EmailForm onSubmit={(email, pass) => loginEmail(email, pass).catch(e => setErr(e.message))} />
                 {err && <p className="text-sm text-center font-medium text-destructive">{err}</p>}
            </CardContent>
        </Card>
    </div>
  );
}
