"use client";

import { createContext, useContext, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

const UserIdContext = createContext<string | null>(null);
export function AuthUserProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  useEffect(() => {
    const { data } = createClient().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") window.location.replace("/login");
      else if (session && session.user.id !== userId) window.location.reload();
    });
    return () => data.subscription.unsubscribe();
  }, [userId]);
  return <UserIdContext.Provider value={userId}>{children}</UserIdContext.Provider>;
}
export function useUserId() {
  const userId = useContext(UserIdContext);
  if (!userId) throw new Error("A signed-in user is required.");
  return userId;
}
export function extractionStorageKey(userId: string) { return `studysync:extraction:${userId}`; }
