<<<<<<< HEAD
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function Root() {
=======
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function RootPage() {
>>>>>>> 47cc8857015bb012d574e1df3f50a346f14ad53c
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
<<<<<<< HEAD
    // Wait until the authentication status is determined.
    if (loading) {
      return;
    }

    // If there is no user, redirect to the login page.
    if (!user) {
      router.replace('/login');
    }
    // If there is a user, the (protected) layout will render the dashboard.
    // No need to redirect here.
    
  }, [user, loading, router]);

  // Render a loading indicator while the auth check is in progress.
  // This prevents a "flash" of content before the redirect can happen.
   if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // If the user is logged in, the protected layout will take over.
  // This component itself doesn't need to render anything in that case.
=======
    if (loading) return;
    router.replace(user ? '/listings' : '/login');
  }, [loading, user, router]);

>>>>>>> 47cc8857015bb012d574e1df3f50a346f14ad53c
  return null;
}