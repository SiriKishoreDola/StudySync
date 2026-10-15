"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type View = "signin" | "signup" | "forgot" | "check-email" | "reset";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";
const primaryButton =
  "w-full rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800";
const linkButton =
  "font-medium text-gray-900 underline-offset-2 hover:underline";

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
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
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
  const [view, setView] = useState<View>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  function go(next: View, message = "") {
    setView(next);
    setError("");
    setNotice(message);
  }

  // NOTE: all handlers below are mock UI behavior.
  // Replace with NextAuth / API calls when the backend is built.
  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Incorrect email or password. Please try again.");
      return;
    }
    router.push("/dashboard");
  }

  function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    router.push("/dashboard");
  }

  function handleForgot(e: React.FormEvent) {
    e.preventDefault();
    go("check-email");
  }

  function handleReset(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setPassword("");
    setConfirm("");
    go("signin", "Password updated. Please sign in.");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <p className="mb-6 text-center text-lg font-bold tracking-tight text-gray-900">
          StudySync
        </p>

        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {copy[view].title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{copy[view].subtitle}</p>
        </div>

        {notice && (
          <p className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {notice}
          </p>
        )}
        {error && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        )}

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
                className="mt-2 text-sm text-gray-500 hover:text-gray-900"
              >
                Forgot password?
              </button>
            </div>
            <button type="submit" className={primaryButton}>
              Sign in
            </button>
            <p className="text-center text-sm text-gray-500">
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
            <button type="submit" className={primaryButton}>
              Create account
            </button>
            <p className="text-center text-sm text-gray-500">
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
            <button type="submit" className={primaryButton}>
              Send reset link
            </button>
            <p className="text-center text-sm text-gray-500">
              <button type="button" onClick={() => go("signin")} className={linkButton}>
                Back to sign in
              </button>
            </p>
          </form>
        )}

        {view === "check-email" && (
          <div className="space-y-4 text-center">
            <p className="text-sm text-gray-600">
              If an account exists for{" "}
              <span className="font-medium text-gray-900">
                {email || "your email"}
              </span>
              , you&apos;ll get a link to reset your password in a few minutes.
            </p>
            <button
              type="button"
              onClick={() => go("signin")}
              className={primaryButton}
            >
              Back to sign in
            </button>
            <p className="text-sm text-gray-500">
              Didn&apos;t get it?{" "}
              <button
                type="button"
                onClick={() => setNotice("Reset link sent again.")}
                className={linkButton}
              >
                Resend email
              </button>
            </p>
            {/* Demo only: in the real app this page is reached from the email link. */}
            <p className="text-xs text-gray-400">
              Demo:{" "}
              <button
                type="button"
                onClick={() => go("reset")}
                className="underline hover:text-gray-600"
              >
                open reset link
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
            <button type="submit" className={primaryButton}>
              Update password
            </button>
          </form>
        )}
      </div>
    </main>
  );
}