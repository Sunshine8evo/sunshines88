import Link from "next/link";
import { notFound } from "next/navigation";

import { getTenantById } from "@/lib/tenants/db";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tenant = await getTenantById(id);

  if (!tenant) {
    notFound();
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://www.sunshines88.com";

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="border-b border-[#eee] bg-white px-6 py-5">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/dashboard/tenants"
            className="text-xs text-[#9a6d95] hover:underline"
          >
            ← All tenants
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-[#2d1a2e]">{tenant.shop_name}</h1>
          <p className="text-sm text-[#666]">Tenant ID: {tenant.id}</p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-6 py-8">
        <section className="rounded-2xl border border-[#eee] bg-white p-6">
          <h2 className="text-lg font-bold">Account</h2>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <Detail label="Slug" value={tenant.slug} />
            <Detail label="Plan" value={tenant.plan} />
            <Detail label="Owner" value={tenant.owner_name} />
            <Detail label="Email" value={tenant.owner_email} />
            <Detail label="Plan status" value={tenant.plan_status ?? "active"} />
            <Detail
              label="Created"
              value={
                tenant.created_at
                  ? new Date(tenant.created_at).toLocaleDateString()
                  : "—"
              }
            />
          </dl>
        </section>

        <section className="rounded-2xl border border-[#eee] bg-white p-6">
          <h2 className="text-lg font-bold">Branding</h2>
          <div className="mt-4 flex items-center gap-4">
            <ColorSwatch label="Primary" color={tenant.primary_color ?? "#e87baa"} />
            <ColorSwatch label="Secondary" color={tenant.secondary_color ?? "#7c5aad"} />
          </div>
        </section>

        <section className="rounded-2xl border border-[#eee] bg-white p-6">
          <h2 className="text-lg font-bold">Links</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <span className="text-[#999]">Customer booking: </span>
              <a
                href={`${baseUrl}/book/${tenant.slug}`}
                className="text-[#e87baa] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {baseUrl}/book/{tenant.slug}
              </a>
            </li>
            <li>
              <span className="text-[#999]">Shop login: </span>
              <a
                href={`${baseUrl}/login`}
                className="text-[#e87baa] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {baseUrl}/login
              </a>
            </li>
            <li>
              <span className="text-[#999]">Shop dashboard: </span>
              <Link
                href={`/dashboard-${tenant.slug}`}
                className="text-[#e87baa] hover:underline"
              >
                /dashboard-{tenant.slug}
              </Link>
            </li>
          </ul>
        </section>

        {tenant.stripe_customer_id ? (
          <section className="rounded-2xl border border-[#eee] bg-white p-6">
            <h2 className="text-lg font-bold">Billing</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Stripe customer" value={tenant.stripe_customer_id} />
              {tenant.trial_ends_at ? (
                <Detail
                  label="Trial ends"
                  value={new Date(tenant.trial_ends_at).toLocaleDateString()}
                />
              ) : null}
            </dl>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-[#999]">{label}</dt>
      <dd className="mt-1 font-medium text-[#2d1a2e]">{value}</dd>
    </div>
  );
}

function ColorSwatch({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="h-8 w-8 rounded-full border border-[#eee]"
        style={{ backgroundColor: color }}
      />
      <div>
        <p className="text-xs text-[#999]">{label}</p>
        <p className="text-sm font-medium">{color}</p>
      </div>
    </div>
  );
}
