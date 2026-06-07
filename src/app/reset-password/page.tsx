"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useEffect, useState } from "react";

import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";
import { createClient } from "@/lib/supabase/client";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const legacyToken = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [supabaseRecovery, setSupabaseRecovery] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (legacyToken) {
      setReady(true);
      return;
    }

    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSupabaseRecovery(true);
        setReady(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (
        (event === "PASSWORD_RECOVERY" || event === "INITIAL_SESSION") &&
        session
      ) {
        setSupabaseRecovery(true);
        setReady(true);
      }
    });

    const timeout = window.setTimeout(() => setReady(true), 1500);

    return () => {
      subscription.unsubscribe();
      window.clearTimeout(timeout);
    };
  }, [legacyToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (supabaseRecovery) {
        const supabase = createClient();
        const { error: updateError } = await supabase.auth.updateUser({
          password,
        });

        if (updateError) {
          setError(updateError.message || "Unable to reset password.");
          return;
        }

        await supabase.auth.signOut();
        setSuccess(true);
        return;
      }

      if (!legacyToken) {
        setError("Reset link is invalid or expired. Please request a new one.");
        return;
      }

      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: legacyToken, password }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(data.error || "Unable to reset password.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Unable to reset password right now.");
    } finally {
      setLoading(false);
    }
  }

  const invalidLink =
    ready && !legacyToken && !supabaseRecovery && !success && !loading;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fefaf2] via-[#fdf6e3] to-[#f7f0dc] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(201,146,42,0.18)] bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <SunshineBrandLogo width={180} className="mx-auto" />
          <p className="mt-2 text-sm text-[#9a7c3a]">Reset Password</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-sm text-[#166534]">
              Password updated successfully.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-[#e8a830] to-[#c9922a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Back to Sign In
            </Link>
          </div>
        ) : invalidLink ? (
          <div className="text-center">
            <p className="text-sm text-[#b91c1c]">
              This reset link is invalid or has expired.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-[#e8a830] to-[#c9922a] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Back to Sign In
            </Link>
          </div>
        ) : !ready ? (
          <p className="text-center text-sm text-[#9a7c3a]">Loading…</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                {error}
              </div>
            )}

            <label className="block text-xs font-semibold text-[#9a7c3a]">
              New Password
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(201,146,42,0.25)] bg-[#fefaf2] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#e8a830]"
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#b89a52]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>

            <label className="block text-xs font-semibold text-[#9a7c3a]">
              Confirm Password
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[rgba(201,146,42,0.25)] bg-[#fefaf2] px-3 py-2.5 text-sm outline-none focus:border-[#e8a830]"
                minLength={6}
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-[#e8a830] to-[#c9922a] py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Saving…" : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#fefaf2] text-sm text-[#9a7c3a]">
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
