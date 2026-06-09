"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        fontFamily: "var(--font-dm-sans, system-ui, sans-serif)",
        background: "#fafafa",
        color: "#1a1a1a",
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: "100%",
          textAlign: "center",
          background: "#fff",
          border: "1px solid #eee",
          borderRadius: 16,
          padding: "32px 24px",
          boxShadow: "0 8px 24px rgba(0,0,0,.06)",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
          Dashboard could not load
        </h1>
        <p style={{ fontSize: 14, color: "#666", lineHeight: 1.5, marginBottom: 20 }}>
          Your session may have expired or the page failed to load. Try again or sign in
          once more.
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "none",
              background: "#e87baa",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reload
          </button>
          <a
            href="/login"
            style={{
              padding: "10px 18px",
              borderRadius: 999,
              border: "1px solid #ddd",
              background: "#fff",
              color: "#333",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </a>
        </div>
      </div>
    </div>
  );
}
