import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { isSSSystem, getUserMetadata } from "@/lib/auth/roles";
import { dmSans } from "@/lib/fonts";
import { createClient } from "@/lib/supabase/server";
import { listTenants } from "@/lib/tenants/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "All Booking Pages",
  description: "S System view of all customer booking pages",
};

export default async function BookIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { role } = getUserMetadata(user);
  if (!isSSSystem(role)) {
    redirect("/unauthorized");
  }

  const tenants = await listTenants();

  return (
    <div
      className={`${dmSans.className} min-h-screen bg-[#fefaf2] px-6 py-10 text-[#1c1408]`}
    >
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#9a7c3a] hover:text-[#c9922a]"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-4 text-2xl font-bold">All Booking Pages</h1>
          <p className="mt-2 text-sm text-[#5a4a1e]">
            S System — customer booking links for every active shop
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {tenants.length === 0 ? (
            <p className="rounded-xl border border-[rgba(201,146,42,.18)] bg-white p-6 text-sm text-[#5a4a1e]">
              No active shops found.
            </p>
          ) : (
            tenants.map((tenant) => (
              <Link
                key={tenant.id}
                href={`/book/${tenant.slug}`}
                className="block rounded-xl border border-[rgba(201,146,42,.18)] bg-white px-5 py-4 shadow-sm transition hover:border-[#e8a830] hover:shadow-md"
              >
                <div className="font-semibold">{tenant.shop_name}</div>
                <div className="mt-1 text-sm text-[#9a7c3a]">
                  /book/{tenant.slug}
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
