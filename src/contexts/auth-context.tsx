'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  getRedirectResult,
  User,
  isSignInWithPopupSupported,
  browserPopupRedirectResolver,
} from 'firebase/auth';

type AuthCtx = {
  user: User | null;
  loading: boolean;
  loginGoogle: () => Promise<void>;
  loginMicrosoft: () => Promise<void>;
  loginEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | undefined>(undefined);

function isPopupRedirectSupported() {
  try {
    return isSignInWithPopupSupported() && !!browserPopupRedirectResolver;
  } catch { return false; }
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Process the redirect result only once on initial load
  useEffect(() => {
    getRedirectResult(auth).catch(() => {/* ignore if not a redirect */});
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u ?? null);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    if (isPopupRedirectSupported()) {
        try {
            await signInWithPopup(auth, provider);
            return;
        } catch (e: any) {
            if (e?.code === "auth/popup-closed-by-user" || e?.code === 'auth/popup-blocked' || e?.code?.startsWith("auth/")) {
                await signInWithRedirect(auth, provider);
                return;
            }
            throw e;
        }
    }
    await signInWithRedirect(auth, provider);
  };

  const loginMicrosoft = async () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.setCustomParameters({ prompt: 'select_account' });
     if (isPopupRedirectSupported()) {
        try {
            await signInWithPopup(auth, provider);
            return;
        } catch (e: any) {
             if (e?.code === "auth/popup-closed-by-user" || e?.code === 'auth/popup-blocked' || e?.code?.startsWith("auth/")) {
                await signInWithRedirect(auth, provider);
                return;
            }
            throw e;
        }
    }
    await signInWithRedirect(auth, provider);
  };

  const loginEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => { await signOut(auth); };

  return (
    <Ctx.Provider value={{ user, loading, loginGoogle, loginMicrosoft, loginEmail, logout }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
