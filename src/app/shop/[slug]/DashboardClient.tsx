"use client";

import { useCallback, useEffect, useState } from "react";

import { getUserMetadata } from "@/lib/auth/roles";
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
  formatWelcomeDate,
  isStaffRole,
  showToolsMenu,
  todayISO,
} from "@/lib/dashboard/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tenant } from "@/lib/tenants/types";
import { useDashboardRealtime } from "@/hooks/useDashboardRealtime";
import { useDashboardTheme } from "@/hooks/useDashboardTheme";

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
  const [payrollPreviewStaff, setPayrollPreviewStaff] = useState(false);
  const [previewTargetStaff, setPreviewTargetStaff] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const showTools = showToolsMenu(role);
  const staffView = isStaffRole(role);
  const ownerPayrollView = showTools && !payrollPreviewStaff;
  const previewStaffLabel = previewTargetStaff || employeeName || "Staff";

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

    const isOwner = showToolsMenu(currentRole);
    const payrollOwnerView = isOwner && !payrollPreviewStaff;
    const effectivePayrollPeriod: PayrollPeriod = payrollOwnerView
      ? payrollPeriod
      : payrollPeriod === "daily"
        ? "weekly"
        : payrollPeriod;
    const payrollStaffName =
      payrollPreviewStaff && previewTargetStaff
        ? previewTargetStaff
        : currentEmployee;

    try {
      const [queueData, todayData, payrollData, saleData] = await Promise.all([
        fetchQueue(supabase, today),
        fetchTodaySummary(supabase, today, currentEmployee),
        fetchPayrollSummary(supabase, effectivePayrollPeriod, {
          ownerView: payrollOwnerView,
          staffName: payrollStaffName,
        }),
        isOwner ? fetchSaleSummary(supabase, salePeriod) : Promise.resolve(EMPTY_SALES),
      ]);

      setQueue(queueData);
      setTodayTurns(todayData);
      setPayrollStaff(payrollData.staff);
      setPayrollGrand(payrollData.grand);
      setPayrollLabel(payrollData.label);
      if (isOwner) setSales(saleData);
    } catch (err) {
      console.error("Dashboard load failed:", err);
    } finally {
      setLoading(false);
    }
  }, [
    employeeName,
    payrollPeriod,
    payrollPreviewStaff,
    previewTargetStaff,
    role,
    salePeriod,
    userName,
  ]);

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

  async function reloadPayroll(
    period: PayrollPeriod,
    ownerView: boolean,
    staffName: string,
  ) {
    const supabase = createClient();
    const effectivePeriod = ownerView ? period : period === "daily" ? "weekly" : period;
    const data = await fetchPayrollSummary(supabase, effectivePeriod, {
      ownerView,
      staffName,
    });
    setPayrollStaff(data.staff);
    setPayrollGrand(data.grand);
    setPayrollLabel(data.label);
  }

  async function handlePayrollPeriodChange(period: PayrollPeriod) {
    setPayrollPeriod(period);
    await reloadPayroll(
      period,
      ownerPayrollView,
      payrollPreviewStaff && previewTargetStaff ? previewTargetStaff : employeeName,
    );
  }

  async function handlePayrollPreviewChange(asStaff: boolean) {
    setPayrollPreviewStaff(asStaff);
    const targetStaff = asStaff
      ? payrollStaff.find((s) => s.id !== "grand")?.name || employeeName
      : employeeName;
    if (asStaff) setPreviewTargetStaff(targetStaff);
    else setPreviewTargetStaff(null);
    await reloadPayroll(payrollPeriod, showTools && !asStaff, targetStaff);
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
          showTools={showTools}
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

          <div className="sd-content">
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
              <div className="sd-welcome-date">{formatWelcomeDate()}</div>
            </div>

            <div className="sd-grid-main">
              <div className="sd-grid-left">
                <QueueCard slug={tenant.slug} items={queue} loading={loading} />
                <PayrollSummary
                  slug={tenant.slug}
                  ownerView={ownerPayrollView}
                  staffName={payrollPreviewStaff ? previewStaffLabel : employeeName}
                  staff={payrollStaff}
                  grand={payrollGrand}
                  periodLabel={payrollLabel}
                  loading={loading}
                  showPreviewToggle={showTools}
                  previewStaff={payrollPreviewStaff}
                  previewStaffLabel={previewStaffLabel}
                  onPreviewChange={handlePayrollPreviewChange}
                  onPeriodChange={handlePayrollPeriodChange}
                />
              </div>

              <div className="sd-grid-right">
                {(staffView || showTools) && (
                  <TodaySummary slug={tenant.slug} turns={todayTurns} loading={loading} />
                )}
                {showTools ? (
                  <SaleSummary
                    slug={tenant.slug}
                    data={sales}
                    loading={loading}
                    onPeriodChange={handleSalePeriodChange}
                  />
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
