"use client";

import Link from "next/link";
import { useState } from "react";

import HardNavLink from "@/components/HardNavLink";
import { getUserMetadata, isSunshineAdmin } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";

type SupabaseLoginFormProps = {
  title: string;
  subtitle?: string;
  redirectAdminTo?: string;
  redirectShopTo?: string;
  /** When set, shop users must match this slug (sunshine_admin bypasses). */
  expectedSlug?: string;
  legacyHref?: string;
  legacyLabel?: string;
  forgotPasswordHref?: string;
};

export default function SupabaseLoginForm({
  title,
  subtitle,
  redirectAdminTo = "/dashboard",
  redirectShopTo,
  expectedSlug,
  legacyHref,
  legacyLabel = "Continue with legacy dashboard",
  forgotPasswordHref,
}: SupabaseLoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword(
        { email: email.trim(), password },
      );

      if (signInError || !data.user) {
        setError(signInError?.message ?? "Incorrect email or password.");
        return;
      }

      const { role, slug } = getUserMetadata(data.user);

      if (isSunshineAdmin(role)) {
        window.location.assign(redirectShopTo ?? redirectAdminTo);
        return;
      }

      if (!slug) {
        await supabase.auth.signOut();
        setError("Your account is missing shop access metadata.");
        return;
      }

      if (expectedSlug && slug !== expectedSlug) {
        await supabase.auth.signOut();
        setError("This account belongs to a different shop. Use the login page for your shop.");
        return;
      }

      const destination = redirectShopTo ?? `/dashboard-${slug}`;
      window.location.assign(destination);
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[#f5c6d0] bg-white p-8 shadow-[0_8px_40px_rgba(232,123,170,.12)]">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-[#2d1a2e]">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-sm text-[#9a6d95]">{subtitle}</p>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-[#666]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e87baa]"
            placeholder="you@example.com"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-[#666]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e87baa]"
            placeholder="Enter password"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-gradient-to-r from-[#f07d96] to-[#e87baa] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {forgotPasswordHref ? (
        <p className="mt-3 text-center text-xs text-[#999]">
          <Link href={forgotPasswordHref} className="text-[#e87baa] hover:underline">
            Forgot password?
          </Link>
        </p>
      ) : null}

      {legacyHref ? (
        <p className="mt-5 text-center text-xs text-[#999]">
          <HardNavLink
            href={legacyHref}
            className="cursor-pointer border-0 bg-transparent p-0 text-[#e87baa] hover:underline"
          >
            {legacyLabel}
          </HardNavLink>
        </p>
      ) : null}

      <p className="mt-4 text-center text-xs text-[#999]">
        <Link href="/dashboard/login" className="text-[#e87baa] hover:underline">
          ← Back to sign-in options
        </Link>
      </p>
    </div>
  );
}
