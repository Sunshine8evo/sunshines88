"use client";

import { useState } from "react";

import {
  getUserMetadata,
  normalizeRole,
  type UserRole,
} from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";

import "./login.css";

export type LoginMode = "ss_system" | "owner_staff";

type LoginFormProps = {
  mode: LoginMode;
  slug?: string;
  redirectTo: string;
};

function isPhone(val: string): boolean {
  const trimmed = val.trim();
  return /^[\d\s\-+().]+$/.test(trimmed) && /\d/.test(trimmed);
}

function normalizePhone(val: string): string {
  return val.replace(/\D/g, "");
}

function isValidPassword(password: string): boolean {
  return password.length >= 6;
}

type PhoneRow = { email?: string | null; phone?: string | null };

async function resolveEmailFromPhone(phone: string): Promise<string | null> {
  const supabase = createClient();
  const digits = normalizePhone(phone);

  const { data: exactMatch } = await supabase
    .from("staff_auth")
    .select("email")
    .eq("phone", phone.trim())
    .maybeSingle();

  if (exactMatch?.email) return String(exactMatch.email);

  const { data: authRows } = await supabase
    .from("staff_auth")
    .select("email,phone")
    .not("phone", "is", null);

  const authHit = (authRows as PhoneRow[] | null)?.find(
    (row) => row.phone && normalizePhone(row.phone) === digits,
  );
  if (authHit?.email) return authHit.email;

  try {
    const { data: staffRows } = await supabase
      .from("staff")
      .select("email,phone")
      .not("phone", "is", null);

    const staffHit = (staffRows as PhoneRow[] | null)?.find(
      (row) => row.phone && normalizePhone(row.phone) === digits,
    );
    if (staffHit?.email) return staffHit.email;
  } catch {
    /* staff.email may not exist */
  }

  return null;
}

export default function LoginForm({ mode, slug, redirectTo }: LoginFormProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const identifierLabel =
    mode === "ss_system" ? "Email (@sunshines88.com)" : "Email / Phone number";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!isValidPassword(password)) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      let email = identifier.trim();

      if (mode === "ss_system") {
        if (!email.toLowerCase().endsWith("@sunshines88.com")) {
          setError("S System login requires an @sunshines88.com email.");
          setLoading(false);
          return;
        }
      }

      if (mode === "owner_staff") {
        if (email.toLowerCase().endsWith("@sunshines88.com")) {
          setError("Please use the S System login page for @sunshines88.com accounts.");
          setLoading(false);
          return;
        }

        if (isPhone(identifier)) {
          const resolved = await resolveEmailFromPhone(identifier);
          if (!resolved) {
            setError("Phone number not found. Please use your email.");
            setLoading(false);
            return;
          }
          email = resolved;
        } else if (!email.includes("@")) {
          setError("Please enter a valid email or phone number.");
          setLoading(false);
          return;
        }
      }

      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError || !data.user) {
        setError(authError?.message ?? "Incorrect email or password.");
        setLoading(false);
        return;
      }

      const { role, slug: userSlug } = getUserMetadata(data.user);
      const normalized = normalizeRole(
        typeof role === "string" ? role : undefined,
      ) as UserRole | undefined;

      if (mode === "ss_system" && normalized !== "ss_system") {
        await supabase.auth.signOut();
        setError("Access denied. S System login only.");
        setLoading(false);
        return;
      }

      if (mode === "owner_staff" && normalized === "ss_system") {
        await supabase.auth.signOut();
        setError("Please use the S System login page.");
        setLoading(false);
        return;
      }

      if (mode === "owner_staff" && slug && userSlug !== slug) {
        await supabase.auth.signOut();
        setError("Access denied for this business.");
        setLoading(false);
        return;
      }

      window.location.assign(redirectTo);
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form className="sl-form" onSubmit={handleSubmit}>
      {error ? <div className="sl-error">{error}</div> : null}

      <div className="sl-field">
        <label className="sl-label" htmlFor="login-identifier">
          {identifierLabel}
        </label>
        <input
          id="login-identifier"
          type={mode === "owner_staff" ? "text" : "email"}
          className="sl-input"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder={mode === "ss_system" ? "you@sunshines88.com" : "email or phone"}
          autoComplete="username"
          required
        />
      </div>

      <div className="sl-field">
        <label className="sl-label" htmlFor="login-password">
          Password
        </label>
        <div className="sl-password-wrap">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            className="sl-input sl-input-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            autoComplete="current-password"
            minLength={6}
            required
          />
          <button
            type="button"
            className="sl-password-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
          >
            {showPassword ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M3 3l18 18M10.58 10.58A2 2 0 0012 15a2 2 0 001.42-.58M9.88 5.1A10.94 10.94 0 0112 5c5 0 9.27 3.11 10 7a11.2 11.2 0 01-4.12 4.94M6.61 6.61A11.2 11.2 0 003 12c.73 3.89 5 7 10 7a10.9 10.9 0 003.39-.55"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75" />
              </svg>
            )}
          </button>
        </div>
        <p className="sl-hint">At least 6 characters — letters and/or numbers</p>
      </div>

      <button type="submit" className="sl-btn" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
