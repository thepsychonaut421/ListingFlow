"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRedirectResult } from "firebase/auth";

import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/";
  const [isLoading, setIsLoading] = useState(false);
  const handledRef = useRef(false);
  const { loginWithMicrosoft } = useAuth();

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

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    try {
      await loginWithMicrosoft();
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
