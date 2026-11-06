"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionCookie } from "@/lib/session";

export async function logIn() {
  const cookieStore = await cookies();
  // No maxAge: the session ends when the browser closes, so a fresh launch
  // starts at Login.
  cookieStore.set(sessionCookie, "placeholder", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  redirect("/");
}

export async function logOut() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookie);
  redirect("/login");
}
