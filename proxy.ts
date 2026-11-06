import { NextResponse, type NextRequest } from "next/server";
import { sessionCookie } from "@/lib/session";

export function proxy(request: NextRequest) {
  const isLoggedIn = request.cookies.has(sessionCookie);
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard", "/timeline", "/upload", "/profile", "/courses/:path*", "/extraction", "/review", "/login"],
};
