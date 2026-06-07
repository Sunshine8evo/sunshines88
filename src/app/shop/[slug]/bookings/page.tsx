import { notFound } from "next/navigation";

import ShopShell from "@/components/dashboard/ShopShell";
import { getTenantBySlug } from "@/lib/tenants/db";
import ShopSection from "@/components/dashboard/ShopSection";

export default async function ShopBookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <ShopShell tenant={tenant} activePath="/bookings">
      <ShopSection
        title="Bookings"
        body="Manage online and walk-in bookings for this location."
        href="/index.html#booking"
      />
    </ShopShell>
  );
}
