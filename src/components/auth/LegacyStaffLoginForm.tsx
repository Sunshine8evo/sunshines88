"use client";

import Link from "next/link";
import { useState } from "react";

import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";

type StaffUser = {
  username: string;
  role: string;
  name: string;
  displayName?: string;
  display_name?: string;
};

type LegacyStaffLoginFormProps = {
  title?: string;
  subtitle?: string;
  redirectTo?: string;
  serifClassName?: string;
};

export default function LegacyStaffLoginForm({
  title = "Business Login",
  subtitle,
  redirectTo = "/dashboard.html",
  serifClassName = "",
}: LegacyStaffLoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = (await res.json()) as { user?: StaffUser; error?: string };

      if (!res.ok || !data.user) {
        setError(data.error ?? "Incorrect username or password.");
        setPassword("");
        return;
      }

      sessionStorage.setItem("sunshine_user", JSON.stringify(data.user));
      window.location.href = redirectTo;
    } catch {
      setError("Unable to sign in right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-[#f5c6d0] bg-white p-8 shadow-[0_8px_40px_rgba(232,93,122,.15)]">
      <div className="mb-7 text-center">
        <SunshineBrandLogo width={240} className="mx-auto" />
        <p className="mt-3 text-xs text-[#999]">Sunshine System</p>
        <h1 className={`mt-2 text-xl font-bold text-[#2d1a2e] ${serifClassName}`}>{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[#9a6d95]">{subtitle}</p> : null}
      </div>

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700">
          {error}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            className="w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-[#666]">Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#ddd] px-3 py-2.5 pr-10 text-sm outline-none focus:border-[#e85d7a]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#888]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "🙈" : "👁"}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <Link href="/reset-password" className="text-[11px] text-[#e85d7a] hover:underline">
            Forgot password?
          </Link>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#e85d7a] py-3 text-sm font-medium text-white hover:bg-[#b8334f] disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-[#999]">
        <Link href="/dashboard/login" className="text-[#e87baa] hover:underline">
          ← Back to entry portal
        </Link>
      </p>
    </div>
  );
}
