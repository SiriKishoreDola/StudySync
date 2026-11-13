import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response, userId } = await updateSession(request);
  // API handlers perform their own verified auth checks and return JSON 401.
  if (request.nextUrl.pathname.startsWith("/api/")) return response;
  const isLogin = request.nextUrl.pathname === "/login";
  let redirect: URL | undefined;
  if (!userId && !isLogin) {
    redirect = new URL("/login", request.url);
    redirect.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
  } else if (userId && isLogin) {
    redirect = new URL("/dashboard", request.url);
  }
  if (!redirect) return response;
  const result = NextResponse.redirect(redirect);
  response.cookies.getAll().forEach(cookie => result.cookies.set(cookie));
  for (const name of ["cache-control", "expires", "pragma"]) {
    const value = response.headers.get(name);
    if (value) result.headers.set(name, value);
  }
  return result;
}

export const config = {
  matcher: ["/dashboard/:path*", "/timeline/:path*", "/upload/:path*", "/profile/:path*", "/courses/:path*", "/extraction/:path*", "/review/:path*", "/login", "/api/:path*"],
};
