"use client";

import { safeNext } from "@/lib/supabase/redirect";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function GoogleSignIn({ next, callbackFailed = false }: { next?: string; callbackFailed?: boolean } = {}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(callbackFailed ? "Sign-in could not be completed. Please try again." : "");
  async function signIn() {
    if (pending) return;
    setPending(true); setError("");
    try {
      const supabase = createClient();
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", safeNext(next ?? new URL(window.location.href).searchParams.get("next")));
      const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: callback.toString() } });
      if (error) throw error;
    } catch {
      setError("Google sign-in is unavailable. Check the Supabase public configuration and try again.");
      setPending(false);
    }
  }
  return <>
    {error && <p role="alert" className="mb-4 text-sm">{error}</p>}
    <button type="button" className="ss-button primary w-full" disabled={pending} onClick={signIn}>
      {pending ? "Redirecting to Google…" : "Continue with Google"}
    </button>
  </>;
}
