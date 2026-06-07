import Link from "next/link";

import { listTenants } from "@/lib/tenants/db";

export default async function TenantsPage() {
  const tenants = await listTenants();

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#eee] bg-white px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <Link
              href="/dashboard"
              className="text-xs text-[#9a6d95] hover:underline"
            >
              ← Admin dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-bold text-[#2d1a2e]">Manage tenants</h1>
          </div>
          <Link
            href="/test1ssteam#pricing"
            className="rounded-full bg-[#e87baa] px-4 py-2 text-xs font-semibold text-white"
          >
            Add shop (trial signup)
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {tenants.length === 0 ? (
          <p className="rounded-2xl border border-[#eee] bg-white p-6 text-sm text-[#666]">
            No tenants yet. Shops created from the landing page trial form will appear here.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-[#eee] bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[#eee] bg-[#fafafa] text-xs uppercase tracking-wide text-[#999]">
                  <th className="px-6 py-3">Shop</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Owner</th>
                  <th className="px-6 py-3">Plan</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t) => (
                  <tr key={t.id} className="border-b border-[#f5f5f5]">
                    <td className="px-6 py-4 font-medium">{t.shop_name}</td>
                    <td className="px-6 py-4 text-[#666]">{t.slug}</td>
                    <td className="px-6 py-4 text-[#666]">{t.owner_email}</td>
                    <td className="px-6 py-4 capitalize">{t.plan}</td>
                    <td className="px-6 py-4 capitalize text-[#666]">
                      {t.plan_status ?? "active"}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/dashboard/tenants/${t.id}`}
                        className="mr-4 text-[#e87baa] hover:underline"
                      >
                        Details
                      </Link>
                      <Link
                        href={`/dashboard-${t.slug}`}
                        className="text-[#e87baa] hover:underline"
                      >
                        Open dashboard
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
