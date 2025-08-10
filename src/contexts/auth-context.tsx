'use client';
import * as React from 'react';
import {
  onAuthStateChanged,
  signOut,
  type User,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  logout: () => Promise<any>;
  loginWithMicrosoft: () => Promise<any>;
}

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

<<<<<<<<< Temporary merge branch 1
  // Logică de redirect centralizată
=========
>>>>>>>>> Temporary merge branch 2
  React.useEffect(() => {
    if (loading) return;

    const isProtectedRoute = !['/login'].includes(pathname);

<<<<<<<<< Temporary merge branch 1
    if (!user && !isAuthPage) {
      router.replace('/login');
    } else if (user && isAuthPage) {
      router.replace('/'); // Ruta dashboard după login
=========
    if (!user && isProtectedRoute) {
        router.push('/login');
>>>>>>>>> Temporary merge branch 2
    }
  }, [user, loading, pathname, router]);

  const logout = () => {
    return signOut(auth);
  };

<<<<<<<<< Temporary merge branch 1
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
=========
  const loginWithMicrosoft = async () => {
    const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (!tenantId) {
        throw new Error('Microsoft Tenant ID is not configured. Please set NEXT_PUBLIC_MICROSOFT_TENANT_ID in your environment variables.');
    }
>>>>>>>>> Temporary merge branch 2
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      tenant: tenantId,
      prompt: 'select_account',
    });

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

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}