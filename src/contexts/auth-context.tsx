'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  OAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  signOut,
  type User,
  OAuthProvider,
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
  const search = searchParams.toString();

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

    const isProtectedRoute = !['/login'].includes(pathname);

    if (!user && !isAuthPage) {
      const nextPath = pathname + (search ? `?${search}` : '');
      const url = nextPath ? `/login?next=${encodeURIComponent(nextPath)}` : '/login';
      router.replace(url);
    } else if (user && isAuthPage) {
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  const logout = () => {
    return signOut(auth);
  };

  const signup = React.useCallback(
    (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass),
    []
  );

  const logout = React.useCallback(async () => {
      await signOut(auth);
      // Ensure redirect after logout
      router.push('/login');
  }, [router]);

  const loginWithMicrosoft = React.useCallback(async () => {
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
        return;
      }
      console.error('Microsoft login error:', e);
      throw e;
    }
  };
  
  const value = {
    user,
    loading,
    logout,
    loginWithMicrosoft,
  };

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
