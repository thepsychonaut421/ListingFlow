'use client';
import * as React from 'react';
import AppShell from '@/components/app-shell';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}