"use client";

import { useEffect, useMemo, useState } from "react";

import {
  type CommissionConfig,
  type StaffListEntry,
  type StaffPayslip,
  fetchActiveCommission,
  fetchStaffList,
  fetchStaffPayslip,
} from "@/lib/dashboard/queries";
import { createClient } from "@/lib/supabase/client";

import "./payroll.css";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

type PayrollClientProps = {
  slug: string;
  shopName: string;
  /** Read-only commission label from Settings (initial display only). */
  commissionLabel?: string;
  /** Hide the standalone page title/back button when embedded in the dashboard. */
  embedded?: boolean;
  /** Owner / SS System can browse every staff payslip and approve pay. */
  canManage?: boolean;
  /** Viewer's own display name — used to show their payslip when canManage is false. */
  selfName?: string;
  /** Viewer's own role/position label — shown on their own payslip. */
  selfRole?: string;
};

const ROLE_LABELS: Record<string, string> = {
  ss_system: "SS System",
  owner: "Owner",
  manager: "Manager",
  reception: "Receptionist",
  staff: "Therapist",
};

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const EMPTY_PAYSLIP: StaffPayslip = {
  income: { base: 0, commission: 0, tips: 0, bonus: 0 },
  gross: 0,
  stats: { clients: 0, hours: 0, tips: 0, commission: 0 },
  sessions: 0,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function startOfWeekMonday(ref: Date) {
  const d = new Date(ref);
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function commTargetFromRole(role?: string) {
  const r = (role || "").toLowerCase();
  if (r.includes("manager")) return "manager";
  if (r.includes("recep")) return "reception";
  if (r.includes("owner")) return "owner";
  return "staff";
}
function commLabelFromConfig(comm: CommissionConfig | null, fallback?: string) {
  if (!comm) return fallback ?? "—";
  return comm.method === "flat" ? `$${comm.price}/session` : `${comm.rate}%`;
}

type WeekOption = { label: string; start: string; end: string };

export default function PayrollClient({
  slug,
  shopName,
  commissionLabel,
  embedded = false,
  canManage = true,
  selfName,
  selfRole,
}: PayrollClientProps) {
  const today = useMemo(() => new Date(), []);

  const weekOptions = useMemo<WeekOption[]>(() => {
    const thisMonday = startOfWeekMonday(today);
    const opts: WeekOption[] = [];
    for (let i = 0; i < 8; i++) {
      const s = new Date(thisMonday);
      s.setDate(s.getDate() - i * 7);
      const e = new Date(s);
      e.setDate(e.getDate() + 6);
      const label =
        `${s.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ` +
        `${e.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` +
        (i === 0 ? " (This week)" : "");
      opts.push({ label, start: isoDate(s), end: isoDate(e) });
    }
    return opts;
  }, [today]);

  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [dailyDate, setDailyDate] = useState(isoDate(today));
  const [weeklyVal, setWeekly] = useState(weekOptions[0].start);
  const [monthVal, setMonth] = useState(`${today.getFullYear()}-${pad(today.getMonth() + 1)}`);
  const [yearVal, setYear] = useState(String(today.getFullYear()));
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const [staffList, setStaffList] = useState<StaffListEntry[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [commLabel, setCommLabel] = useState(commissionLabel ?? "—");
  const [data, setData] = useState<StaffPayslip>(EMPTY_PAYSLIP);
  const [loading, setLoading] = useState(true);

  const selectedStaff = staffList.find((s) => s.id === selectedStaffId) ?? staffList[0] ?? null;

  const selfStaff = {
    id: "EMP-ME",
    name: selfName?.trim() || "You",
    role: selfRole ? ROLE_LABELS[selfRole] ?? selfRole : "Therapist",
  };

  const displayStaff = canManage
    ? selectedStaff
      ? { id: selectedStaff.id, name: selectedStaff.name, role: selectedStaff.role }
      : selfStaff
    : selfStaff;

  const avatar = (displayStaff.name || "Y").charAt(0).toUpperCase();
  const commTarget = commTargetFromRole(
    canManage ? selectedStaff?.role ?? selfRole : selfRole,
  );

  function currentRange(): { start: string; end: string } {
    if (period === "daily") return { start: dailyDate, end: dailyDate };
    if (period === "weekly") {
      const w = weekOptions.find((o) => o.start === weeklyVal) ?? weekOptions[0];
      return { start: w.start, end: w.end };
    }
    if (period === "monthly") {
      const [y, m] = monthVal.split("-").map(Number);
      const last = new Date(y, m, 0).getDate();
      return { start: `${monthVal}-01`, end: `${monthVal}-${pad(last)}` };
    }
    return { start: `${yearVal}-01-01`, end: `${yearVal}-12-31` };
  }

  function chipLabel() {
    if (period === "daily") {
      const d = new Date(`${dailyDate}T12:00:00`);
      return (
        "📅 " +
        d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      );
    }
    if (period === "weekly") {
      const w = weekOptions.find((o) => o.start === weeklyVal) ?? weekOptions[0];
      return "📅 " + w.label.replace(" (This week)", "");
    }
    if (period === "monthly") {
      const [y, m] = monthVal.split("-");
      return "📅 " + MONTH_NAMES[parseInt(m, 10) - 1] + " " + y;
    }
    return "📅 Year " + yearVal;
  }

  // Load the real staff roster so owners can pick any staff.
  useEffect(() => {
    if (!canManage) return;
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const list = await fetchStaffList(supabase);
        if (cancelled) return;
        setStaffList(list);
        setSelectedStaffId((prev) => prev ?? list[0]?.id ?? null);
      } catch {
        if (!cancelled) setStaffList([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canManage]);

  // Fetch real earnings for the displayed staff + period.
  const staffName = displayStaff.name;
  useEffect(() => {
    if (!staffName || staffName === "You") {
      setData(EMPTY_PAYSLIP);
      setCommLabel(commissionLabel ?? "—");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const supabase = createClient();
        const range = currentRange();
        const comm = await fetchActiveCommission(supabase, commTarget);
        const slip = await fetchStaffPayslip(
          supabase,
          range.start,
          range.end,
          staffName,
          comm,
        );
        if (cancelled) return;
        setData(slip);
        setCommLabel(commLabelFromConfig(comm, commissionLabel));
      } catch {
        if (!cancelled) setData(EMPTY_PAYSLIP);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, dailyDate, weeklyVal, monthVal, yearVal, staffName, commTarget]);

  const { income, gross, stats } = data;
  const periodValue = chipLabel().replace("📅 ", "");
  const generatedOn = today.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const money = (n: number) => `$${n.toFixed(2)}`;

  return (
    <div className="sunshine-payslip" data-theme={theme}>
      <div className="page">
        <div className="page-header">
          {!embedded && (
            <div className="ph-left">
              <button
                className="back-btn"
                type="button"
                onClick={() => {
                  if (window.history.length > 1) window.history.back();
                  else window.location.assign(`/dashboard-${slug}`);
                }}
                aria-label="Back"
              >
                ←
              </button>
              <div>
                <div className="ph-title">Payroll Summary</div>
                <div className="ph-sub">Individual payslip detail</div>
              </div>
            </div>
          )}
          <div className="ph-actions">
            <button
              className="theme-toggle"
              type="button"
              onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
              aria-label="Toggle theme"
            >
              🌓
            </button>
            <button className="btn" type="button" onClick={() => window.print()}>
              🖨️ Print
            </button>
            <button className="btn" type="button" onClick={() => window.print()}>
              📄 Export PDF
            </button>
            {canManage && (
              <button className="btn btn-primary" type="button">
                ✓ Approve &amp; Pay
              </button>
            )}
          </div>
        </div>

        {canManage && (
          <div className="filter-bar">
            <select
              className="filter-select"
              value={selectedStaff?.id ?? ""}
              onChange={(e) => setSelectedStaffId(e.target.value)}
            >
              {staffList.length === 0 ? (
                <option value="">No staff found</option>
              ) : (
                staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.role}
                  </option>
                ))
              )}
            </select>
          </div>
        )}

        <div className="period-tabs">
          {(["daily", "weekly", "monthly", "yearly"] as PeriodType[]).map((p) => (
            <button
              key={p}
              type="button"
              className={`period-tab ${period === p ? "active" : ""}`}
              onClick={() => setPeriod(p)}
            >
              {p === "daily" && "📆 Daily"}
              {p === "weekly" && "🗓️ Weekly"}
              {p === "monthly" && "📅 Monthly"}
              {p === "yearly" && "🎯 Yearly"}
            </button>
          ))}
        </div>

        <div className="period-picker-bar">
          {period === "daily" && (
            <div className="period-picker">
              <label className="pp-label">Select Date</label>
              <input
                type="date"
                className="filter-select"
                value={dailyDate}
                onChange={(e) => setDailyDate(e.target.value)}
              />
            </div>
          )}
          {period === "weekly" && (
            <div className="period-picker">
              <label className="pp-label">
                Select Week{" "}
                <span className="pp-note">· week starts Monday</span>
              </label>
              <select
                className="filter-select"
                value={weeklyVal}
                onChange={(e) => setWeekly(e.target.value)}
              >
                {weekOptions.map((o) => (
                  <option key={o.start} value={o.start}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          {period === "monthly" && (
            <div className="period-picker">
              <label className="pp-label">Select Month</label>
              <input
                type="month"
                className="filter-select"
                value={monthVal}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
          )}
          {period === "yearly" && (
            <div className="period-picker">
              <label className="pp-label">Select Year</label>
              <select
                className="filter-select"
                value={yearVal}
                onChange={(e) => setYear(e.target.value)}
              >
                {[0, 1, 2].map((back) => {
                  const y = String(today.getFullYear() - back);
                  return <option key={y}>{y}</option>;
                })}
              </select>
            </div>
          )}
          <div className="pay-period-chip">{chipLabel()}</div>
        </div>

        <div className="payslip">
          <div className="payslip-header">
            <div className="psh-left">
              <div className="psh-avatar">{avatar}</div>
              <div>
                <div className="psh-name">{displayStaff.name}</div>
                <div className="psh-meta">
                  <span className="psh-meta-item">
                    ID: <strong>{displayStaff.id}</strong>
                  </span>
                  <span className="psh-meta-item">
                    Position: <strong>{displayStaff.role}</strong>
                  </span>
                  <span className="psh-meta-item">
                    Status: <strong>Active</strong>
                  </span>
                </div>
              </div>
            </div>
            <div className="psh-period">
              <div className="psh-period-label">Pay Period</div>
              <div className="psh-period-value">{periodValue}</div>
            </div>
          </div>

          <div className="payslip-body">
            <div className="ps-section" style={{ gridColumn: "1/-1" }}>
              <div className="ps-section-title">
                💰 Income {loading ? <span className="ps-loading">· calculating…</span> : null}
              </div>
              <div className="ps-row">
                <span>Base Payment</span>
                <span className="amt">{money(income.base)}</span>
              </div>
              <div className="ps-row">
                <span>
                  Service Commission
                  <span className="comm-method-tag">{commLabel}</span>
                </span>
                <span className="amt">{money(income.commission)}</span>
              </div>
              <div className="ps-row">
                <span>Tips</span>
                <span className="amt">{money(income.tips)}</span>
              </div>
              <div className="ps-row">
                <span>Bonus</span>
                <span className="amt">{money(income.bonus)}</span>
              </div>
              <div className="ps-row subtotal">
                <span>Gross Pay</span>
                <span className="amt">{money(gross)}</span>
              </div>
            </div>

            <div className="netpay-card">
              <div className="np-left">
                <div className="np-breakdown">
                  <div className="np-item">
                    <span className="np-item-label">Total Income</span>
                    <span className="np-item-val">{money(gross)}</span>
                  </div>
                  <div className="np-item">
                    <span className="np-item-label">Sessions</span>
                    <span className="np-item-val">{data.sessions}</span>
                  </div>
                  <div className="np-item">
                    <span className="np-item-label">Pay Period</span>
                    <span className="np-item-val" style={{ fontSize: 13 }}>
                      {periodValue}
                    </span>
                  </div>
                </div>
              </div>
              <div className="np-right">
                <div className="np-label">Net Pay</div>
                <div className="np-value">{money(gross)}</div>
              </div>
            </div>

            <div className="ps-section perf-card">
              <div className="ps-section-title">📊 Booking Statistics</div>
              <div className="perf-grid">
                <div className="perf-stat">
                  <div className="perf-icon">👥</div>
                  <div className="perf-val">{stats.clients}</div>
                  <div className="perf-label">Clients Served</div>
                </div>
                <div className="perf-stat">
                  <div className="perf-icon">⏱️</div>
                  <div className="perf-val">{stats.hours}</div>
                  <div className="perf-label">Service Hours</div>
                </div>
                <div className="perf-stat">
                  <div className="perf-icon">💵</div>
                  <div className="perf-val">${stats.tips}</div>
                  <div className="perf-label">Tip Credit</div>
                </div>
                <div className="perf-stat">
                  <div className="perf-icon">📈</div>
                  <div className="perf-val">${stats.commission}</div>
                  <div className="perf-label">Commission</div>
                </div>
              </div>
            </div>
          </div>

          <div className="payslip-footer">
            <div className="psf-brand">
              🌞 <strong>Sunshine Booking System</strong> · {shopName}
            </div>
            <div>Generated {generatedOn}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
