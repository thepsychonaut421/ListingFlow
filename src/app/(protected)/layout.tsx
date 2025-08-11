'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

import AppShell from '@/components/app-shell';
import { useAuth } from '@/contexts/auth-context';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
