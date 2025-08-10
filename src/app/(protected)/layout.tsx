'use client';

import * as React from 'react';
import AppShell from '@/components/app-shell';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Dacă nu se încarcă și nu există utilizator, redirecționează la login
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Afișează un ecran de încărcare în timpul verificării stării de autentificare
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Odată ce utilizatorul este confirmat, randează layout-ul protejat
  return <AppShell>{children}</AppShell>;
}
