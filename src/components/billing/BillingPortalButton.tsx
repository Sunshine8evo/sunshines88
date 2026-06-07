"use client";

import { useState } from "react";

type BillingPortalButtonProps = {
  slug: string;
  customerId?: string | null;
  label?: string;
  className?: string;
};

export default function BillingPortalButton({
  slug,
  customerId,
  label = "Manage billing",
  className = "",
}: BillingPortalButtonProps) {
  const [loading, setLoading] = useState(false);

  async function openPortal() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, customerId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        alert(data.error ?? "Unable to open billing portal.");
        return;
      }
      window.location.href = data.url;
    } catch {
      alert("Unable to open billing portal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={openPortal}
      disabled={loading}
      className={
        className ||
        "rounded-xl bg-gradient-to-r from-[#e87baa] to-[#7c5aad] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      }
    >
      {loading ? "Opening…" : label}
    </button>
  );
}
