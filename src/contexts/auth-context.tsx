'use client';
import * as React from 'react';
import { onAuthStateChanged, signOut, OAuthProvider, signInWithRedirect, setPersistence, browserLocalPersistence, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<unknown>;
  loginWithMicrosoft: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();
  const pathname = (usePathname() ?? '').toLowerCase();
  const isLogin = pathname === '/login' || pathname.startsWith('/login?');
  const bounced = React.useRef(false);

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => { bounced.current = false; }, [pathname]);

  React.useEffect(() => {
    if (loading) return;
    if (!user && !isLogin && !bounced.current) {
      bounced.current = true;
      router.replace('/login');
    } else if (user && isLogin && !bounced.current) {
      bounced.current = true;
      router.replace('/listings');
    }
  }, [loading, user, isLogin, router]);

  const logout = React.useCallback(async () => {
    await signOut(auth);
    router.push('/login');
  }, [router]);

  const loginWithMicrosoft = React.useCallback(async () => {
    await setPersistence(auth, browserLocalPersistence);
    const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (!tenant) throw new Error('FATAL: Microsoft Tenant ID missing');
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ tenant, prompt: 'select_account' });
    await signInWithRedirect(auth, provider);
  }, []);

  const value = React.useMemo(() => ({ user, loading, logout, loginWithMicrosoft }), [user, loading, logout, loginWithMicrosoft]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}