"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ShopSignOutProps = {
  slug: string;
  className?: string;
};

export default function ShopSignOut({ slug, className }: ShopSignOutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSignOut() {
    setLoading(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push(`/dashboard-${slug}/login`);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={
        className ??
        "rounded-full border border-[#e5e5e5] px-4 py-2 text-xs font-medium text-[#666] hover:border-[#e87baa] hover:text-[#e87baa] disabled:opacity-60"
      }
    >
      {loading ? "Signing out…" : "↪️ Log out"}
    </button>
  );
}
