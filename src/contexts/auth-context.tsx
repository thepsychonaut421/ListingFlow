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
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  const pathname = usePathname();
  const { toast } = useToast();

  React.useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  React.useEffect(() => {
    if (loading) return;

    const isProtectedRoute = !['/login'].includes(pathname);

    if (!user && isProtectedRoute) {
        router.push('/login');
    }
  }, [user, loading, pathname, router]);


  const logout = () => {
    return signOut(auth);
  };

  const loginWithMicrosoft = async () => {
    const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID?.trim();
    if (!tenantId) {
      toast({
        variant: 'destructive',
        title: 'Configuration Error',
        description: 'Microsoft Tenant ID is not configured.',
      });
      throw new Error(
        'Microsoft Tenant ID is not configured. Please set NEXT_PUBLIC_MICROSOFT_TENANT_ID in your environment variables.'
      );
    }
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
