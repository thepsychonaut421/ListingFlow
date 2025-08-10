'use client';

import * as React from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  OAuthProvider,
  signInWithRedirect,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<unknown>;
  signup: (email: string, pass: string) => Promise<unknown>;
  logout: () => Promise<unknown>;
  loginWithMicrosoft: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Logică de redirect centralizată
  React.useEffect(() => {
    if (loading) return;

    const isAuthPage = pathname === '/login';

    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/listings'); // Ruta dashboard după login
    }
  }, [loading, user, pathname, router]);


  const login = React.useCallback(
    (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass),
    []
  );

  const signup = React.useCallback(
    (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass),
    []
  );

  const logout = React.useCallback(async () => {
      await signOut(auth);
      router.push('/login');
  }, [router]);

  const loginWithMicrosoft = React.useCallback(async () => {
    await setPersistence(auth, browserLocalPersistence);
    const provider = new OAuthProvider('microsoft.com');

    const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (!tenant || tenant === 'your-tenant-id') {
      throw new Error('FATAL: Microsoft Tenant ID is not configured in environment variables.');
    }

    provider.setCustomParameters({
      tenant,
      prompt: 'select_account',
    });

    await signInWithRedirect(auth, provider);
  }, []);

  const value: AuthContextType = React.useMemo(
    () => ({ user, loading, login, signup, logout, loginWithMicrosoft }),
    [user, loading, login, signup, logout, loginWithMicrosoft]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
