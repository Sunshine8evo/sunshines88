"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  canSeeSales,
  canSeeTools,
  getUserMetadata,
  isStaff,
  normalizeRole,
} from "@/lib/auth/roles";
import {
  fetchPayrollSummary,
  fetchQueue,
  fetchSaleSummary,
  fetchTodaySummary,
  resolveEmployeeName,
} from "@/lib/dashboard/queries";
import type {
  PayrollPeriod,
  QueueItem,
  SalePeriod,
  SaleSummaryData,
  StaffPayroll,
  TodayTurn,
} from "@/lib/dashboard/types";
import {
  LEGACY_EMBED,
  resolveLegacyEmbedKind,
} from "@/lib/dashboard/constants";
import {
  toLegacySunshineUser,
  writeLegacySunshineSession,
} from "@/lib/dashboard/legacy-session";
import { postLangToCalendarIframe, readStoredLang } from "@/lib/dashboard/languages";
import { todayISO } from "@/lib/dashboard/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenants/types";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { useDashboardTheme } from "@/hooks/useDashboardTheme";

import LegalFooter from "@/components/marketing/LegalFooter";

import LanguageSelector from "./components/LanguageSelector";
import PayrollSummary from "./components/PayrollSummary";
import QueueCard from "./components/QueueCard";
import SaleSummary from "./components/SaleSummary";
import Sidebar from "./components/Sidebar";
import TodaySummary from "./components/TodaySummary";
import Topbar from "./components/Topbar";

type DashboardClientProps = {
  tenant: Tenant;
  shopAddress?: string;
};

const EMPTY_SALES: SaleSummaryData = {
  clientCount: 0,
  revenue: 0,
  cash: { services: 0, addons: 0, tips: 0, total: 0 },
  card: { services: 0, addons: 0, tips: 0, total: 0 },
  grand: { services: 0, addons: 0, tips: 0, total: 0 },
};

export default function DashboardClient({ tenant, shopAddress }: DashboardClientProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useDashboardTheme();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userName, setUserName] = useState(tenant.owner_name);
  const [role, setRole] = useState<string | undefined>("owner");
  const [employeeName, setEmployeeName] = useState(tenant.owner_name);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [todayTurns, setTodayTurns] = useState<TodayTurn[]>([]);
  const [payrollStaff, setPayrollStaff] = useState<StaffPayroll[]>([]);
  const [payrollGrand, setPayrollGrand] = useState<StaffPayroll | null>(null);
  const [payrollLabel, setPayrollLabel] = useState("");
  const [sales, setSales] = useState<SaleSummaryData>(EMPTY_SALES);

  const [payrollPeriod, setPayrollPeriod] = useState<PayrollPeriod>("daily");
  const [salePeriod, setSalePeriod] = useState<SalePeriod>("today");
  const [loading, setLoading] = useState(true);
  const [hash, setHash] = useState(() =>
    typeof window !== "undefined" ? window.location.hash : "",
  );
  const [legacyEmbedReady, setLegacyEmbedReady] = useState(false);

  const normalizedRole = normalizeRole(role);
  const showTools = canSeeTools(role);
  const showSales = canSeeSales(role);
  const staffUser = isStaff(role);
  const ownerPayrollView = normalizedRole === "ss_system" || normalizedRole === "owner";

  const loadDashboard = useCallback(async () => {
    const supabase = createClient();
    const today = todayISO();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    let currentRole = role;
    let currentName = userName;
    let currentEmployee = employeeName;

    if (session?.user) {
      const meta = getUserMetadata(session.user);
      currentRole = meta.role ?? currentRole;
      currentName =
        (typeof session.user.user_metadata?.name === "string"
          ? session.user.user_metadata.name
          : null) ||
        session.user.email?.split("@")[0] ||
        currentName;
      currentEmployee = await resolveEmployeeName(
        supabase,
        currentName,
        session.user.email,
      );
      setRole(currentRole);
      setUserName(currentName);
      setEmployeeName(currentEmployee);
    }

    const r = normalizeRole(currentRole);
    const payrollOwnerView = r === "ss_system" || r === "owner";
    const effectivePayrollPeriod: PayrollPeriod = payrollOwnerView
      ? payrollPeriod
      : payrollPeriod === "daily"
        ? "weekly"
        : payrollPeriod;
    const canLoadSales = r === "ss_system" || r === "owner";

    try {
      const [queueData, todayData, payrollData, saleData] = await Promise.all([
        fetchQueue(supabase, today),
        staffUser || payrollOwnerView
          ? fetchTodaySummary(supabase, today, currentEmployee)
          : Promise.resolve([]),
        fetchPayrollSummary(supabase, effectivePayrollPeriod, {
          ownerView: payrollOwnerView,
          staffName: currentEmployee,
        }),
        canLoadSales ? fetchSaleSummary(supabase, salePeriod) : Promise.resolve(EMPTY_SALES),
      ]);

      setQueue(queueData);
      setTodayTurns(todayData);
      setPayrollStaff(payrollData.staff);
      setPayrollGrand(payrollData.grand);
      setPayrollLabel(payrollData.label);
      if (canLoadSales) setSales(saleData);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeName, payrollPeriod, role, salePeriod, staffUser, userName]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  useDashboardRealtime(tenant.id, loadDashboard);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth <= 768) {
        setCollapsed(false);
        setMobileOpen(false);
      }
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useLayoutEffect(() => {
    setHash(window.location.hash);
  }, [pathname]);

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash);
    window.addEventListener("hashchange", syncHash);
    window.addEventListener("popstate", syncHash);
    return () => {
      window.removeEventListener("hashchange", syncHash);
      window.removeEventListener("popstate", syncHash);
    };
  }, []);

  const onDashboard =
    pathname === "/dashboard" ||
    pathname === `/shop/${tenant.slug}` ||
    pathname === `/dashboard-${tenant.slug}`;
  const embedKind = onDashboard ? resolveLegacyEmbedKind(hash) : null;
  const embedConfig = embedKind ? LEGACY_EMBED[embedKind] : null;

  useEffect(() => {
    if (!embedKind) {
      setLegacyEmbedReady(false);
      return;
    }

    let cancelled = false;

    async function prepareLegacyEmbed() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const legacyUser = toLegacySunshineUser(session?.user ?? null);
      if (legacyUser) {
        writeLegacySunshineSession(legacyUser);
      }

      if (!cancelled) {
        setLegacyEmbedReady(true);
      }
    }

    void prepareLegacyEmbed();

    return () => {
      cancelled = true;
    };
  }, [embedKind]);

  async function handlePayrollPeriodChange(period: PayrollPeriod) {
    setPayrollPeriod(period);
    const supabase = createClient();
    const effectivePeriod = ownerPayrollView ? period : period === "daily" ? "weekly" : period;
    const data = await fetchPayrollSummary(supabase, effectivePeriod, {
      ownerView: ownerPayrollView,
      staffName: employeeName,
    });
    setPayrollStaff(data.staff);
    setPayrollGrand(data.grand);
    setPayrollLabel(data.label);
  }

  async function handleSalePeriodChange(period: SalePeriod) {
    setSalePeriod(period);
    const supabase = createClient();
    const data = await fetchSaleSummary(supabase, period);
    setSales(data);
  }

  return (
    <div className="sunshine-dashboard">
      <div className="sd-app">
        <Sidebar
          slug={tenant.slug}
          shopName={tenant.shop_name}
          shopAddress={shopAddress}
          role={role}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed((c) => !c)}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="sd-main">
          <Topbar
            userName={userName}
            role={role}
            theme={theme}
            onToggleTheme={toggleTheme}
            onMobileMenu={() => setMobileOpen(true)}
          />

          <div className={`sd-content${embedKind ? " sd-content-calendar" : ""}`}>
            {embedConfig ? (
              <div className="sd-calendar-panel">
                <div
                  className={`sd-welcome-bar${embedKind === "calendar" ? " sd-welcome-bar--calendar" : ""}`}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      className="sd-sidebar-inline-toggle"
                      onClick={() => setCollapsed((c) => !c)}
                      title="Toggle menu"
                      aria-label="Toggle menu"
                    >
                      {collapsed ? "☰" : "✕"}
                    </button>
                    <div className="sd-welcome-text">
                      <h2>{embedConfig.title}</h2>
                      <p>
                        {embedKind === "calendar"
                          ? `Booking calendar for ${tenant.shop_name}`
                          : `Live queue board for ${tenant.shop_name}`}
                      </p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>
                {legacyEmbedReady ? (
                  <iframe
                    title={embedConfig.iframeTitle}
                    src={embedConfig.iframeSrc}
                    className="sd-calendar-frame"
                    onLoad={() => postLangToCalendarIframe(readStoredLang())}
                  />
                ) : (
                  <div className="sd-calendar-loading">{embedConfig.loadingLabel}</div>
                )}
              </div>
            ) : (
              <>
                <div className="sd-welcome-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                      type="button"
                      className="sd-sidebar-inline-toggle"
                      onClick={() => setCollapsed((c) => !c)}
                      title="Toggle menu"
                      aria-label="Toggle menu"
                    >
                      {collapsed ? "☰" : "✕"}
                    </button>
                    <div className="sd-welcome-text">
                      <h2>Welcome back, {userName} 👋</h2>
                      <p>Here&apos;s what&apos;s happening at {tenant.shop_name} today.</p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>

                <div className="sd-grid-main">
                  <div className="sd-grid-left">
                    <QueueCard slug={tenant.slug} items={queue} loading={loading} />
                    <PayrollSummary
                      slug={tenant.slug}
                      ownerView={ownerPayrollView}
                      staffName={employeeName}
                      staff={payrollStaff}
                      grand={payrollGrand}
                      periodLabel={payrollLabel}
                      loading={loading}
                      onPeriodChange={handlePayrollPeriodChange}
                    />
                  </div>

                  <div className="sd-grid-right">
                    {(staffUser || showTools) && (
                      <TodaySummary slug={tenant.slug} turns={todayTurns} loading={loading} />
                    )}
                    {showSales ? (
                      <SaleSummary
                        slug={tenant.slug}
                        data={sales}
                        loading={loading}
                        onPeriodChange={handleSalePeriodChange}
                      />
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>

          <LegalFooter variant="dashboard" />
        </div>
      </div>
    </div>
  );
}
