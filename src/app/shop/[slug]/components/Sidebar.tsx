"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import ShopSignOut from "@/components/auth/ShopSignOut";
import { canSeeTools, isSSSystem } from "@/lib/auth/roles";
import { initials } from "@/lib/dashboard/utils";

type SidebarProps = {
  slug: string;
  shopName: string;
  shopAddress?: string;
  role: string | undefined;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
};

export default function Sidebar({
  slug,
  shopName,
  shopAddress,
  role,
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const base = `/dashboard-${slug}`;
  const showTools = canSeeTools(role);
  const isSystem = isSSSystem(role);

  const navClass = (href: string, exact = false) => {
    const active = exact ? pathname === href : pathname.startsWith(href);
    return `sd-nav-item${active ? " active" : ""}`;
  };

  return (
    <>
      <aside
        className={`sd-sidebar${collapsed ? " collapsed" : ""}${mobileOpen ? " mobile-open" : ""}`}
      >
        <button
          type="button"
          className="sd-sidebar-toggle"
          onClick={onToggle}
          aria-label="Toggle sidebar"
        >
          {collapsed ? "☰" : "✕"}
        </button>

        <div className="sd-sidebar-logo">
          <div className="sd-logo-mark">S</div>
          <div className="sd-logo-text">
            Sunshine
            <small>Booking System</small>
          </div>
        </div>

        <div className="sd-sidebar-biz">
          <div className="sd-biz-logo">{initials(shopName)}</div>
          <div>
            <div className="sd-biz-name">{shopName}</div>
            {shopAddress ? <div className="sd-biz-addr">📍 {shopAddress}</div> : null}
          </div>
        </div>

        <div className="sd-sidebar-section">Booking Info</div>
        <Link href={base} className={navClass(base, true)} onClick={onMobileClose}>
          <span>⬛</span> Dashboard
        </Link>
        <Link href={`${base}/calendar`} className={navClass(`${base}/calendar`)} onClick={onMobileClose}>
          <span>📅</span> Calendar
        </Link>
        <Link href={`${base}/bookings`} className={navClass(`${base}/bookings`)} onClick={onMobileClose}>
          <span>🖥️</span> Queue Screen
        </Link>
        <Link href={`${base}/customers`} className={navClass(`${base}/customers`)} onClick={onMobileClose}>
          <span>👤</span> Clients
        </Link>
        <div
          className="sd-nav-item"
          style={{
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 2,
            cursor: "default",
            paddingBottom: 4,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>👥</span>
            <span>Employees</span>
          </div>
          <div className="sd-nav-sub" style={{ width: "100%" }}>
            <Link
              href={`${base}/employees`}
              className={navClass(`${base}/employees`)}
              style={{ padding: "5px 8px", fontSize: 12 }}
              onClick={onMobileClose}
            >
              <span>🪪</span> Profile
            </Link>
            <Link
              href={`${base}/reports`}
              className={navClass(`${base}/reports`)}
              style={{ padding: "5px 8px", fontSize: 12 }}
              onClick={onMobileClose}
            >
              <span>💰</span> Payroll
            </Link>
          </div>
        </div>

        {showTools ? (
          <div className="sd-sidebar-tools">
            <div className="sd-sidebar-section">Tools</div>
            {isSystem ? (
              <Link href="/dashboard/tenants" className={navClass("/dashboard/tenants")} onClick={onMobileClose}>
                <span>🏪</span> Clients Business
              </Link>
            ) : null}
            <Link href={`${base}/reports`} className={navClass(`${base}/reports`)} onClick={onMobileClose}>
              <span>📊</span> Payroll Summary
            </Link>
            <Link href={`${base}/reports`} className={navClass(`${base}/reports`)} onClick={onMobileClose}>
              <span>📈</span> Sale Summary
            </Link>
            <Link href={`${base}/settings`} className={navClass(`${base}/settings`)} onClick={onMobileClose}>
              <span>⚙️</span> Settings
            </Link>
          </div>
        ) : null}

        <div className="sd-sidebar-bottom">
          <ShopSignOut slug={slug} className="sd-logout-btn" />
        </div>
      </aside>

      <div
        className={`sd-sidebar-overlay${mobileOpen ? " show" : ""}`}
        onClick={onMobileClose}
        onKeyDown={(e) => e.key === "Escape" && onMobileClose()}
        role="presentation"
      />
    </>
  );
}
