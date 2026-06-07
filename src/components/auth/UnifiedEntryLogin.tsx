"use client";

import { useSearchParams } from "next/navigation";

import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";

export default function UnifiedEntryLogin() {
  const searchParams = useSearchParams();
  const ret = searchParams.get("return");
  const businessLoginHref = `/index-sunshinetest/login${
    ret ? `?return=${encodeURIComponent(ret)}` : ""
  }`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf0f3] via-[#fff5f7] to-[#fce4ec] px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="rounded-2xl border border-[#f5c6d0] bg-white p-8 shadow-[0_8px_40px_rgba(232,93,122,.15)]">
          <div className="mb-8 text-center">
            <SunshineBrandLogo width={220} className="mx-auto" />
            <p className="mt-3 text-xs text-[#999]">Sunshine System</p>
          </div>

          <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-[#9a6d95]">
            Sign in
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <a
              href="/index.html"
              className="flex flex-col items-center justify-center rounded-xl border-2 border-[#e87baa] bg-gradient-to-br from-[#fde8f2] to-[#fff] px-4 py-5 text-center transition hover:shadow-md"
            >
              <span className="text-2xl">🌞</span>
              <span className="mt-2 text-sm font-semibold text-[#2d1a2e]">Sunshine Team Login</span>
              <span className="mt-1 text-[10px] text-[#9a6d95]">Internal team &amp; legacy system</span>
            </a>
            <a
              href={businessLoginHref}
              className="flex flex-col items-center justify-center rounded-xl border-2 border-[#7c5aad] bg-gradient-to-br from-[#ede6f8] to-[#fff] px-4 py-5 text-center transition hover:shadow-md"
            >
              <span className="text-2xl">🏪</span>
              <span className="mt-2 text-sm font-semibold text-[#2d1a2e]">Business Login</span>
              <span className="mt-1 text-[10px] text-[#9a6d95]">Shop owner &amp; staff</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
