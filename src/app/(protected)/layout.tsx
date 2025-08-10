'use client';
import * as React from 'react';
import AppShell from '@/components/app-shell';
<<<<<<<<< Temporary merge branch 1
import { useAuth } from '@/contexts/auth-context';
import { Loader2 } from 'lucide-react';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  // If loading, or if not loading and no user, show loading screen.
  // The redirect logic is handled centrally in AuthProvider.
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
=========
>>>>>>>>> Temporary merge branch 2

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}