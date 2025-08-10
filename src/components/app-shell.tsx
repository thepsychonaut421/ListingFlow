'use client';

import * as React from 'react';

type Props = { children: React.ReactNode };

/**
 * AppShell nu mai gestionează autentificarea.
 * Doar structurează layout-ul și randarea conținutului.
 */
export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* aici poți adăuga header/sidebar dacă vrei, dar fără logică de auth */}
      {children}
    </div>
  );
}