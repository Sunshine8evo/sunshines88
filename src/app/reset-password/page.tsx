"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("Reset link is invalid.");
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf0f3] via-[#fff5f7] to-[#fce4ec] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#f5c6d0] bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <Image
            src="/assets/sunshine-logo.png"
            alt="Sunshine"
            width={140}
            height={48}
            className="mx-auto h-10 w-auto object-contain"
            priority
          />
          <p className="mt-2 text-sm text-[#888]">Reset Password</p>
        </div>

        {success ? (
          <div className="text-center">
            <p className="text-sm text-[#2a8a52]">
              Password updated successfully.
            </p>
            <Link
              href="/index.html"
              className="mt-6 inline-block rounded-lg bg-[#e85d7a] px-5 py-2.5 text-sm font-medium text-white"
            >
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
                {error}
              </div>
            )}

            <label className="block text-xs font-medium text-[#666]">
              New Password
              <div className="relative mt-1.5">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[#ddd] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#e85d7a]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#888]"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
            </label>

            <label className="block text-xs font-medium text-[#666]">
              Confirm Password
              <input
                type={showPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
                required
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#e85d7a] py-3 text-sm font-medium text-white transition hover:bg-[#b8334f] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Update Password"}
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
        <div className="flex min-h-screen items-center justify-center bg-[#fdf0f3] text-sm text-[#666]">
          Loading...
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
