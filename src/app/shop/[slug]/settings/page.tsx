import { notFound } from "next/navigation";

import ShopSection from "@/components/dashboard/ShopSection";
import ShopShell from "@/components/dashboard/ShopShell";
import { getTenantBySlug } from "@/lib/tenants/db";

export default async function ShopSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <ShopShell tenant={tenant} activePath="/settings">
      <ShopSection title="Settings" body="Shop branding, hours, payments, and integrations." href="/index.html#settings" />
    </ShopShell>
  );
}
