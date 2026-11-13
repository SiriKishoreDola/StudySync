"use client";

import { useEffect, useState } from "react";
import { GoogleSignIn } from "@/components/google-sign-in";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

type View = "signin" | "signup" | "forgot" | "check-email" | "reset";

// StudySync theme (from the team design guide):
// cream #e6d8c1 page bg | surface #f8f2e9 cards/inputs | mauve #a37c76 primary
// ink #211b19 text | border #bead99
const fontStyle = {
  fontFamily: "Inter, Arial, Helvetica, sans-serif",
  lineHeight: 1.5,
};
const focusRing =
  "focus-visible:[outline:3px_solid_#211b19] focus-visible:[outline-offset:3px]";
const surface = "rounded-[14px] border border-[#bead99] bg-[#f8f2e9]";
const inputClass = `w-full max-w-full rounded-[6px] border border-[#bead99] bg-[#f8f2e9] px-3 py-2.5 text-sm text-[#211b19] ${focusRing}`;
const buttonBase = `rounded-[6px] border px-[15px] py-[9px] text-sm font-semibold text-[#211b19] hover:brightness-[.96] disabled:opacity-[.55] ${focusRing}`;
const primaryButton = `${buttonBase} w-full border-[#a37c76] bg-[#a37c76]`;
const linkButton = `font-semibold underline underline-offset-2 ${focusRing}`;

type FieldProps = {
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
};

function Field({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required
        className={inputClass}
      />
    </label>
  );
}

const copy: Record<View, { title: string; subtitle: string }> = {
  signin: { title: "Welcome back", subtitle: "Sign in to continue" },
  signup: { title: "Create your account", subtitle: "Start organizing your semester" },
  forgot: {
    title: "Forgot your password?",
    subtitle: "Enter your email and we'll send you a reset link",
  },
  "check-email": {
    title: "Check your email",
    subtitle: "We sent a password reset link",
  },
  reset: { title: "Set a new password", subtitle: "Choose a password you'll remember" },
};

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [view, setView] = useState<View>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  // When someone opens the reset link from their email, show the reset form.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (new URL(window.location.href).searchParams.has("error")) setError("Google sign-in could not be completed. Please try again.");
    }, 0);
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setView("reset");
        setError("");
        setNotice("");
      }
    });
    return () => { clearTimeout(timer); data.subscription.unsubscribe(); };
  }, [supabase]);

  function go(next: View, message = "") {
    setView(next);
    setError("");
    setNotice(message);
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    router.push("/dashboard");
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.session) {
      router.push("/dashboard");
    } else {
      go("signin", "Account created. Please sign in.");
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    go("check-email");
  }

  async function handleResend() {
    setError("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setNotice("Reset link sent again.");
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    await supabase.auth.signOut();
    setLoading(false);
    setPassword("");
    setConfirm("");
    go("signin", "Password updated. Please sign in.");
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#e6d8c1] px-4 py-10 text-[#211b19]"
      style={fontStyle}
    >
      <div className={`${surface} w-full max-w-md p-6`}>
        <p className="mb-6 text-center text-xl font-semibold">StudySync</p>

        <div className="mb-6 text-center">
          <h1 className="text-[22px] font-semibold">{copy[view].title}</h1>
          <p className="mt-1 text-sm">{copy[view].subtitle}</p>
        </div>

        {notice && (
          <p className="mb-4 border-l-[3px] border-[#a37c76] pl-3 text-[13px]">
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-[6px] border border-[#a37c76] bg-[#f8f2e9] px-3 py-2 text-sm font-semibold"
          >
            {error}
          </p>
        )}

        {(view === "signin" || view === "signup") && <div className="mb-5"><GoogleSignIn /></div>}
        {view === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <div>
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => go("forgot")}
                className={`mt-2 text-sm underline underline-offset-2 ${focusRing}`}
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <button type="button" onClick={() => go("signup")} className={linkButton}>
                Sign up
              </button>
            </p>
          </form>
        )}

        {view === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <Field
              label="Full name"
              value={name}
              onChange={setName}
              placeholder="Your name"
              autoComplete="name"
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <Field
              label="Confirm password"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter your password"
              autoComplete="new-password"
            />
            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? "Creating account..." : "Create account"}
            </button>
            <p className="text-center text-sm">
              Already have an account?{" "}
              <button type="button" onClick={() => go("signin")} className={linkButton}>
                Sign in
              </button>
            </p>
          </form>
        )}

        {view === "forgot" && (
          <form onSubmit={handleForgot} className="space-y-4">
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              autoComplete="email"
            />
            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <p className="text-center text-sm">
              <button type="button" onClick={() => go("signin")} className={linkButton}>
                Back to sign in
              </button>
            </p>
          </form>
        )}

        {view === "check-email" && (
          <div className="space-y-4 text-center">
            <p className="text-sm">
              If an account exists for{" "}
              <strong>{email || "your email"}</strong>, you&apos;ll get a link
              to reset your password in a few minutes.
            </p>
            <button
              type="button"
              onClick={() => go("signin")}
              className={primaryButton}
            >
              Back to sign in
            </button>
            <p className="text-sm">
              Didn&apos;t get it?{" "}
              <button type="button" onClick={handleResend} className={linkButton}>
                Resend email
              </button>
            </p>
          </div>
        )}

        {view === "reset" && (
          <form onSubmit={handleReset} className="space-y-4">
            <Field
              label="New password"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="At least 8 characters"
              autoComplete="new-password"
            />
            <Field
              label="Confirm new password"
              type="password"
              value={confirm}
              onChange={setConfirm}
              placeholder="Re-enter your new password"
              autoComplete="new-password"
            />
            <button type="submit" disabled={loading} className={primaryButton}>
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}