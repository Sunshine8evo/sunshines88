"use client";

import { useState } from "react";

import { getUserMetadata, isSSSystem, normalizeRole } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/client";

import "@/components/auth/login.css";

function isPhone(val: string): boolean {
  const trimmed = val.trim();
  return /^[\d\s\-+().]+$/.test(trimmed) && /\d/.test(trimmed);
}

function normalizePhone(val: string): string {
  return val.replace(/\D/g, "");
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
    /* staff.phone may not exist */
  }

  return null;
}

export default function LoginClient() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");

    if (!identifier.trim()) {
      setError("Please enter your email or phone number.");
      return;
    }

    if (!password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      let loginEmail = identifier.trim();

      if (isPhone(identifier)) {
        const resolved = await resolveEmailFromPhone(identifier);
        if (!resolved) {
          setError("Phone number not found. Please use your email address.");
          setLoading(false);
          return;
        }
        loginEmail = resolved;
      } else if (!loginEmail.includes("@")) {
        setError("Please enter a valid email or phone number.");
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (authError || !data.user) {
        setError("Invalid email or password. Please try again.");
        setLoading(false);
        return;
      }

      const { role, slug: userSlug } = getUserMetadata(data.user);
      const normalized = normalizeRole(typeof role === "string" ? role : undefined);

      if (isSSSystem(normalized)) {
        window.location.assign("/dashboard");
        return;
      }

      if (userSlug) {
        window.location.assign(`/dashboard-${userSlug}`);
        return;
      }

      await supabase.auth.signOut();
      setError("Account not linked to any business. Please contact support.");
      setLoading(false);
    } catch {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setInfo("");

    if (!identifier.trim()) {
      setError("Enter your owner email address first, then click Forgot password.");
      return;
    }

    if (isPhone(identifier)) {
      setError("Forgot password requires your owner email address (not phone).");
      return;
    }

    if (!identifier.includes("@")) {
      setError("Please enter a valid owner email address.");
      return;
    }

    setForgotLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = (await response.json()) as { error?: string; message?: string };

      if (!response.ok) {
        setError(data.error ?? "Unable to send reset email.");
        return;
      }

      setInfo(data.message ?? "A password reset link has been sent to your email.");
    } catch {
      setError("Unable to send reset email right now.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <div className="sunshine-login">
      <div className="sl-card sl-card--unified">
        <div className="sl-logo-wrap">
          <div className="sl-logo-mark">S</div>
          <h1 className="sl-heading">Sunshine Booking</h1>
          <p className="sl-subtitle">Sign in to your account</p>
        </div>

        <form className="sl-form" onSubmit={handleSubmit}>
          {error ? <div className="sl-error">{error}</div> : null}
          {info ? <div className="sl-info">{info}</div> : null}

          <div className="sl-field">
            <label className="sl-label" htmlFor="login-identifier">
              Email or Phone Number
            </label>
            <input
              id="login-identifier"
              type="text"
              className="sl-input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="email@example.com or (xxx) xxx-xxxx"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="sl-field">
            <div className="sl-label-row">
              <label className="sl-label" htmlFor="login-password">
                Password
              </label>
              <button
                type="button"
                className="sl-forgot-link"
                onClick={handleForgotPassword}
                disabled={loading || forgotLoading}
              >
                {forgotLoading ? "Sending…" : "Forgot password?"}
              </button>
            </div>
            <div className="sl-password-wrap">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="sl-input sl-input-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
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
          </div>

          <button type="submit" className="sl-btn" disabled={loading || forgotLoading}>
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>

        <p className="sl-footer">
          Powered by <strong>Sunshine Evolution Technology</strong>
        </p>
      </div>
    </div>
  );
}
