import Link from "next/link";

import { listTenants } from "@/lib/tenants/db";

export default async function SunshineAdminDashboardPage() {
  const tenants = await listTenants();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#eee] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9a6d95]">Sunshine Team</p>
            <h1 className="text-2xl font-bold text-[#2d1a2e]">Admin Dashboard</h1>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/tenants"
              className="rounded-full border border-[#e5e5e5] px-4 py-2 text-xs font-medium text-[#666]"
            >
              Manage tenants
            </Link>
            <Link
              href="/test1ssteam"
              className="rounded-full border border-[#e5e5e5] px-4 py-2 text-xs font-medium text-[#666]"
            >
              Landing preview
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard label="Active shops" value={String(tenants.length)} />
          <StatCard label="Bookings today" value="—" />
          <StatCard label="Revenue today" value="—" />
        </div>

        <section className="rounded-2xl border border-[#eee] bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Tenants</h2>
            <span className="text-xs text-[#999]">Run supabase-tenants.sql if empty</span>
          </div>

          {tenants.length === 0 ? (
            <p className="text-sm text-[#666]">
              No tenants yet. New shops created from the landing page trial form will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#eee] text-xs uppercase tracking-wide text-[#999]">
                    <th className="py-2 pr-4">Shop</th>
                    <th className="py-2 pr-4">Slug</th>
                    <th className="py-2 pr-4">Owner</th>
                    <th className="py-2 pr-4">Plan</th>
                    <th className="py-2">Links</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((t) => (
                    <tr key={t.id} className="border-b border-[#f5f5f5]">
                      <td className="py-3 pr-4 font-medium">{t.shop_name}</td>
                      <td className="py-3 pr-4 text-[#666]">{t.slug}</td>
                      <td className="py-3 pr-4 text-[#666]">{t.owner_email}</td>
                      <td className="py-3 pr-4 capitalize">{t.plan}</td>
                      <td className="py-3">
                        <Link
                          href={`/dashboard/tenants/${t.id}`}
                          className="mr-3 text-[#e87baa] hover:underline"
                        >
                          Details
                        </Link>
                        <Link
                          href={`/dashboard-${t.slug}`}
                          className="mr-3 text-[#e87baa] hover:underline"
                        >
                          Dashboard
                        </Link>
                        <Link
                          href={`/book/${t.slug}`}
                          className="text-[#e87baa] hover:underline"
                        >
                          Booking
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#eee] bg-white p-5">
      <p className="text-xs uppercase tracking-wide text-[#999]">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[#2d1a2e]">{value}</p>
    </div>
  );
}
