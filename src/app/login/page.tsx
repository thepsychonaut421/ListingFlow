
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Package } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleLogin = () => {
    // In a real app, you would handle authentication here.
    // For this local app, we'll just set a flag in localStorage.
    try {
      localStorage.setItem('isLoggedIn', 'true');
      router.push('/');
    } catch (error) {
      console.error('Failed to set login status in localStorage', error);
      alert('Could not log in. Please ensure your browser allows localStorage.');
    }
  };

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
            Click the button below to access your local dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Form can be extended with username/password if needed later */}
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>
            Sign In
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
