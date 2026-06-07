import Link from "next/link";

import ShopSignOut from "@/components/auth/ShopSignOut";
import type { Tenant } from "@/lib/tenants/types";

const NAV = [
  { href: "", label: "Overview" },
  { href: "/calendar", label: "Calendar" },
  { href: "/bookings", label: "Bookings" },
  { href: "/customers", label: "Customers" },
  { href: "/employees", label: "Employees" },
  { href: "/services", label: "Services" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

type ShopShellProps = {
  tenant: Tenant;
  children: React.ReactNode;
  activePath?: string;
};

export default function ShopShell({ tenant, children, activePath = "" }: ShopShellProps) {
  const base = `/dashboard-${tenant.slug}`;
  const primary = tenant.primary_color ?? "#e87baa";

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#1a1a1a]">
      <header
        className="border-b border-[#eee] bg-white px-6 py-4"
        style={{ borderTop: `3px solid ${primary}` }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-[#9a6d95]">Shop Dashboard</p>
            <h1 className="text-xl font-bold">{tenant.shop_name}</h1>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/index.html"
              className="rounded-full border border-[#e5e5e5] px-4 py-2 text-xs font-medium text-[#666] hover:border-[#e87baa] hover:text-[#e87baa]"
            >
              Legacy calendar
            </a>
            <ShopSignOut slug={tenant.slug} />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-6 py-6 lg:grid-cols-[220px_1fr]">
        <nav className="h-fit rounded-xl border border-[#eee] bg-white p-3">
          <ul className="space-y-1">
            {NAV.map((item) => {
              const href = `${base}${item.href}`;
              const active = activePath === item.href;
              return (
                <li key={item.href || "overview"}>
                  <Link
                    href={href}
                    className={`block rounded-lg px-3 py-2 text-sm ${
                      active
                        ? "bg-[#fdf0f3] font-semibold text-[#b8334f]"
                        : "text-[#666] hover:bg-[#fafafa]"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <main>{children}</main>
      </div>
    </div>
  );
}
