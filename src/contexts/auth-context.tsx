'use client';

import * as React from 'react';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

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

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = React.useCallback(
    (email: string, pass: string) => signInWithEmailAndPassword(auth, email, pass),
    []
  );

  const signup = React.useCallback(
    (email: string, pass: string) => createUserWithEmailAndPassword(auth, email, pass),
    []
  );

  const logout = React.useCallback(() => signOut(auth), []);

  const loginWithMicrosoft = React.useCallback(async () => {
    const provider = new OAuthProvider('microsoft.com');

    // opțional: restrânge pe tenant; dacă nu e setat, merge multi-tenant conform setărilor din Firebase/Azure
    const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (tenant) {
      provider.setCustomParameters({
        tenant,
        prompt: 'select_account',
      });
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      // fallback când pop-up-ul e blocat sau există un alt popup în curs
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
        await signInWithRedirect(auth, provider);
        return;
      }
      throw e;
    }
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