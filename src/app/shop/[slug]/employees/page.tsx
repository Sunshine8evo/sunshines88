import { notFound } from "next/navigation";

import ShopSection from "@/components/dashboard/ShopSection";
import ShopShell from "@/components/dashboard/ShopShell";
import { getTenantBySlug } from "@/lib/tenants/db";

export default async function ShopEmployeesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlug(slug);
  if (!tenant) notFound();

  return (
    <ShopShell tenant={tenant} activePath="/employees">
      <ShopSection title="Employees" body="Staff roster, schedules, and roles." href="/employee.html" />
    </ShopShell>
  );
}
