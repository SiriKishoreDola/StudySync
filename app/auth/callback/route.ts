import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/supabase/redirect";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code && !url.searchParams.has("error")) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(safeNext(url.searchParams.get("next")), url.origin), { headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Expires": "0" } });
    } catch { /* Return a safe error; never log OAuth codes or tokens. */ }
  }
  return NextResponse.redirect(new URL("/login?error=oauth", url.origin), { headers: { "Cache-Control": "private, no-store", "Pragma": "no-cache", "Expires": "0" } });
}
