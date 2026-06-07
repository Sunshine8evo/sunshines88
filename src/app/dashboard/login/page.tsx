import { Suspense } from "react";

import UnifiedEntryLogin from "@/components/auth/UnifiedEntryLogin";

export default function DashboardLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf0f3] via-white to-[#fce8ee]">
          <p className="text-sm text-[#9a6d95]">Loading…</p>
        </div>
      }
    >
      <UnifiedEntryLogin />
    </Suspense>
  );
}
