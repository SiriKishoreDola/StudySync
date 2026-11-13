import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseConfig } from "./config";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  let userId: string | null = null;
  try {
    const { url, key } = getSupabaseConfig();
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(values, headers) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          if (headers) Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
        },
      },
    });
    const { data, error } = await supabase.auth.getClaims();
    if (!error && typeof data?.claims?.sub === "string") userId = data.claims.sub;
  } catch { /* Fail closed without logging token-bearing auth errors. */ }
  response.headers.set("Cache-Control", "private, no-store");
  return { response, userId };
}
