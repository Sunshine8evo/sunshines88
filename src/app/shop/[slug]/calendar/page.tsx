import { notFound } from "next/navigation";

import ShopSection from "@/components/dashboard/ShopSection";
import ShopShell from "@/components/dashboard/ShopShell";
import { getTenantBySlug } from "@/lib/tenants/db";

export default async function ShopCalendarPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <ShopShell tenant={tenant} activePath="/calendar">
      <ShopSection
        title="Calendar"
        body="Calendar view will load bookings filtered by this shop's tenant_id."
        href="/index.html#booking"
        linkLabel="Open legacy calendar →"
      />
    </ShopShell>
  );
}
