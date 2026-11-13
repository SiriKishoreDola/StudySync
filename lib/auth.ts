import { createClient } from "@/lib/supabase/server";

/** Validate with Supabase Auth, never trust a cookie's mere presence or client ID. */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user?.id ?? null;
  } catch {
    return null;
  }
}
