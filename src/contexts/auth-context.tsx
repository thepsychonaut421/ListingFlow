'use client';
import * as React from 'react';
import {
  onAuthStateChanged,
  signOut,
  type User,
  OAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

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
  
  // This ref helps prevent multiple redirects during initialization
  const isProcessingAuth = React.useRef(false);

  React.useEffect(() => {
    const processAuth = async () => {
       if (isProcessingAuth.current) return;
       isProcessingAuth.current = true;
       setLoading(true);

        try {
            // Check for redirect result first
            const result = await getRedirectResult(auth);
            if (result?.user) {
                setUser(result.user);
                setLoading(false);
                isProcessingAuth.current = false;
                router.replace('/dashboard');
                return; // Stop further processing
            }
        } catch (error) {
            console.error("Error getting redirect result:", error);
        }

        // If no redirect result, set up the listener
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            const isLoginPage = pathname === '/login';
            if (currentUser && isLoginPage) {
                router.replace('/dashboard');
            } else if (!currentUser && !isLoginPage) {
                router.replace('/login');
            }
            setLoading(false);
            isProcessingAuth.current = false;
        });

        return () => unsubscribe();
    };

    processAuth();
  // We only want this to run once on mount, so we pass an empty dependency array.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const logout = () => {
    return signOut(auth);
  };

  const loginWithMicrosoft = async () => {
    await setPersistence(auth, browserLocalPersistence);
    const tenantId = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
    if (!tenantId) {
        throw new Error('Microsoft Tenant ID is not configured. Please set NEXT_PUBLIC_MICROSOFT_TENANT_ID in your environment variables.');
    }
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({
      tenant: tenantId,
    });

    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (e?.code === 'auth/popup-blocked' || e?.code === 'auth/cancelled-popup-request') {
        // Fallback to redirect if popup is blocked
        await signInWithRedirect(auth, provider);
      } else {
        console.error('Microsoft login error:', e);
        throw e; // Re-throw the error to be caught by the caller
      }
    }
  };
  
  const value = {
    user,
    loading,
    logout,
    loginWithMicrosoft,
  };
  
  const isAuthPage = pathname === '/login';

  // Show a global loader while we are verifying the auth state
  if (loading && !isAuthPage) {
     return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
  }
  
  // Prevent rendering of protected pages if not authenticated and not on the login page
  if (!loading && !user && !isAuthPage) {
      return null; // Or a loading screen. AuthProvider's effect will redirect.
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
