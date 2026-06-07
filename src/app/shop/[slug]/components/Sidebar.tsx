"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import ShopSignOut from "@/components/auth/ShopSignOut";
import { canSeeTools, isSSSystem } from "@/lib/auth/roles";
import {
  type LegacyEmbedKind,
  dashboardHashHref,
  resolveDashboardBase,
  resolveLegacyEmbedKind,
} from "@/lib/dashboard/constants";

type SidebarProps = {
  slug: string;
  shopName: string;
  role: string | undefined;
  collapsed: boolean;
  mobileOpen: boolean;
  onToggle: () => void;
  onMobileClose: () => void;
};

function hashActive(kind: LegacyEmbedKind, hash: string): boolean {
  return resolveLegacyEmbedKind(hash) === kind;
}

export default function Sidebar({
  slug,
  shopName,
  role,
  collapsed,
  mobileOpen,
  onToggle,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const [hash, setHash] = useState("");
  const dashboardBase = resolveDashboardBase(pathname, slug);
  const showTools = canSeeTools(role);
  const isSystem = isSSSystem(role);
  const embedKind = resolveLegacyEmbedKind(hash);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    syncHash();
    window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  const onDashboardPath =
    pathname === "/dashboard" ||
    pathname === `/dashboard-${slug}` ||
    pathname === `/shop/${slug}`;

  const dashboardActive = onDashboardPath && !embedKind;

  const hashLink = (kind: LegacyEmbedKind, label: string, icon: string) => {
    const href = dashboardHashHref(dashboardBase, kind);
    const active = onDashboardPath && hashActive(kind, hash);
    return (
      <a
        href={href}
        className={`sd-nav-item${active ? " active" : ""}`}
        onClick={onMobileClose}
      >
        <span>{icon}</span> {label}
      </a>
    );
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

        <div className="sd-sidebar-section">Booking Info</div>
        <Link
          href={dashboardBase}
          className={`sd-nav-item${dashboardActive ? " active" : ""}`}
          onClick={onMobileClose}
        >
          <span>⬛</span> Dashboard
        </Link>
        {hashLink("calendar", "Calendar", "📅")}
        {hashLink("queue", "Queue Screen", "🖥️")}
        {hashLink("clients", "Clients", "👤")}

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
            <a
              href={dashboardHashHref(dashboardBase, "employee-profile")}
              className={`sd-nav-item${onDashboardPath && hashActive("employee-profile", hash) ? " active" : ""}`}
              style={{ padding: "5px 8px", fontSize: 12 }}
              onClick={onMobileClose}
            >
              <span>🪪</span> Profile
            </a>
            <a
              href={dashboardHashHref(dashboardBase, "employee-payroll")}
              className={`sd-nav-item${onDashboardPath && hashActive("employee-payroll", hash) ? " active" : ""}`}
              style={{ padding: "5px 8px", fontSize: 12 }}
              onClick={onMobileClose}
            >
              <span>💰</span> Payroll
            </a>
          </div>
        </div>

        {showTools ? (
          <div className="sd-sidebar-tools">
            <div className="sd-sidebar-section">Tools</div>
            {isSystem ? hashLink("clientsbusiness", "Clients Business", "🏪") : null}
            {hashLink("payrollsummary", "Payroll Summary", "📊")}
            {hashLink("salesummary", "Sale Summary", "📈")}
            {hashLink("setting", "Settings", "⚙️")}
          </div>
        ) : null}

        <div className="sd-sidebar-logout">
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
