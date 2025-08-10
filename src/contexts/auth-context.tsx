'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  OAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { auth } from '@/lib/firebase/client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, current => {
      setUser(current);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Redirect based on auth state
  useEffect(() => {
    if (loading) return;
    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      const nextPath = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
      const url = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login';
      router.replace(url);
    } else if (user && isAuthPage) {
      const next = searchParams.get('next') || '/';
      router.replace(next);
    }
  }, [user, loading, pathname, searchParams, router]);

  const loginWithMicrosoft = useCallback(async () => {
    await setPersistence(auth, browserLocalPersistence);
    const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (!tenant) throw new Error('NEXT_PUBLIC_MICROSOFT_TENANT_ID missing');
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ tenant, prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
      } else {
        console.error('Microsoft login error:', e);
        throw e;
      }
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [router]);

  const value = { user, loading, loginWithMicrosoft, logout };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
