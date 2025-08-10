"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  OAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const handledRef = useRef(false);

  // După redirect-ul de la Microsoft
  useEffect(() => {
    getRedirectResult(auth)
      .then((cred) => {
        if (cred?.user && !handledRef.current) {
          handledRef.current = true;
          router.replace(next);
        }
      })
      .catch((e) => console.debug("[AUTH DBG] getRedirectResult error", e));
  }, [next, router]);

  // Dacă user-ul e deja logat
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && !handledRef.current) {
        handledRef.current = true;
        router.replace(next);
      }
    });
    return () => unsub();
  }, [next, router]);

  // Login Microsoft
  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence);

      const tenant = process.env.NEXT_PUBLIC_MICROSOFT_TENANT_ID;
      if (!tenant) throw new Error("NEXT_PUBLIC_MICROSOFT_TENANT_ID lipsă.");

      const provider = new OAuthProvider("microsoft.com");
      provider.setCustomParameters({ tenant, prompt: "select_account" });

      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error("Login failed", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <button
        onClick={handleMicrosoftLogin}
        disabled={isLoading}
        className="px-4 py-2 rounded bg-blue-600 text-white"
      >
        {isLoading ? "Redirecting..." : "Sign in with Microsoft"}
      </button>
    </div>
  );
}