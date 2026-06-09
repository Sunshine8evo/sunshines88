"use client";

import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { usePathname } from "next/navigation";

import {
  canSeeSales,
  canSeeTools,
  getUserMetadata,
  isSSSystem,
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
  dashboardHashHref,
  resolveDashboardBase,
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

import { DEMO_LOCATIONS } from "@/components/booking/booking-flow-v5-data";
import LegalFooter from "@/components/marketing/LegalFooter";

import ClientsBusinessPanel from "./components/ClientsBusinessPanel";
import DashboardClock from "./components/DashboardClock";
import LanguageSelector from "./components/LanguageSelector";
import PayrollSummary from "./components/PayrollSummary";
import QueueCard from "./components/QueueCard";
import SaleSummary from "./components/SaleSummary";
import Sidebar from "./components/Sidebar";
import TodaySummary from "./components/TodaySummary";
import Topbar from "./components/Topbar";

type DashboardClientProps = {
  tenant: Tenant;
};

function resolveShopAddress(slug: string): string | undefined {
  const key = slug.toLowerCase();
  if (key.includes("test") || key.includes("sunshine")) {
    return DEMO_LOCATIONS[0]?.addr;
  }
  return undefined;
}

const EMPTY_SALES: SaleSummaryData = {
  clientCount: 0,
  revenue: 0,
  cash: { services: 0, addons: 0, tips: 0, total: 0 },
  card: { services: 0, addons: 0, tips: 0, total: 0 },
  grand: { services: 0, addons: 0, tips: 0, total: 0 },
};

export default function DashboardClient({ tenant }: DashboardClientProps) {
  const shopAddress = resolveShopAddress(tenant.slug);
  const shopLogoUrl =
    "logo_url" in tenant && typeof tenant.logo_url === "string" ? tenant.logo_url : null;
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
  const [legacySessionReady, setLegacySessionReady] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const normalizedRole = normalizeRole(role);
  const showTools = canSeeTools(role);
  const showSales = canSeeSales(role);
  const staffUser = isStaff(role);
  const ownerPayrollView = normalizedRole === "ss_system" || normalizedRole === "owner";

  const onDashboard =
    pathname === "/dashboard" ||
    pathname === `/shop/${tenant.slug}` ||
    pathname === `/dashboard-${tenant.slug}`;
  const dashboardBase = resolveDashboardBase(pathname, tenant.slug);
  const rawEmbedKind = onDashboard ? resolveLegacyEmbedKind(hash) : null;
  const embedKind =
    rawEmbedKind &&
    LEGACY_EMBED[rawEmbedKind].ssOnly &&
    !isSSSystem(role)
      ? null
      : rawEmbedKind;
  const embedConfig = embedKind ? LEGACY_EMBED[embedKind] : null;
  const nativeEmbed = embedKind === "clientsbusiness";
  const isEmbedView = Boolean(embedKind);

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
    if (isEmbedView) {
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(() => {
      void loadDashboard();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isEmbedView, loadDashboard]);

  useDashboardRealtime(tenant.id, loadDashboard, !isEmbedView);

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

  useEffect(() => {
    let cancelled = false;

    async function prepareLegacySession() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const legacyUser = toLegacySunshineUser(session?.user ?? null);
      if (legacyUser) {
        writeLegacySunshineSession(legacyUser);
      }

      if (!cancelled) {
        setLegacySessionReady(true);
      }
    }

    void prepareLegacySession();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setIframeLoaded(false);
  }, [embedKind]);

  useEffect(() => {
    function onEmbedNav(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; hash?: string } | null;
      if (data?.type !== "sunshine-dashboard-nav") return;

      const nextHash = typeof data.hash === "string" ? data.hash : "";
      const target = `${dashboardBase}${nextHash}`;
      if (`${window.location.pathname}${window.location.hash}` !== target) {
        window.location.assign(target);
      }
    }

    window.addEventListener("message", onEmbedNav);
    return () => window.removeEventListener("message", onEmbedNav);
  }, [dashboardBase]);

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
          role={role}
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => setCollapsed((c) => !c)}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className={`sd-main${embedKind ? " sd-main--embed" : ""}`}>
          <Topbar
            shopName={tenant.shop_name}
            shopAddress={shopAddress}
            shopLogoUrl={shopLogoUrl}
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
                      <p>{embedConfig.subtitle(tenant.shop_name)}</p>
                    </div>
                  </div>
                  <LanguageSelector />
                </div>
                {nativeEmbed ? (
                  <ClientsBusinessPanel currentSlug={tenant.slug} />
                ) : legacySessionReady && embedConfig.iframeSrc ? (
                  <div className="sd-embed-frame-wrap">
                    {!iframeLoaded ? (
                      <div className="sd-calendar-loading">{embedConfig.loadingLabel}</div>
                    ) : null}
                    <iframe
                      key={embedConfig.iframeSrc}
                      title={embedConfig.iframeTitle}
                      src={embedConfig.iframeSrc}
                      className={`sd-calendar-frame${iframeLoaded ? "" : " sd-calendar-frame--loading"}`}
                      onLoad={() => {
                        setIframeLoaded(true);
                        postLangToCalendarIframe(readStoredLang());
                      }}
                    />
                  </div>
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
                  <div className="sd-welcome-actions">
                    <DashboardClock />
                    <LanguageSelector />
                  </div>
                </div>

                <div className="sd-grid-main">
                  <div className="sd-grid-left">
                    <QueueCard
                      slug={tenant.slug}
                      dashboardBase={dashboardBase}
                      items={queue}
                      loading={loading}
                    />
                    <PayrollSummary
                      slug={tenant.slug}
                      dashboardBase={dashboardBase}
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
                      <TodaySummary
                        slug={tenant.slug}
                        dashboardBase={dashboardBase}
                        turns={todayTurns}
                        loading={loading}
                      />
                    )}
                    {showSales ? (
                      <SaleSummary
                        slug={tenant.slug}
                        dashboardBase={dashboardBase}
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
