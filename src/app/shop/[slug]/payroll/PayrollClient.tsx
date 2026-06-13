"use client";

import { useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import "./payroll.css";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

type PayrollClientProps = {
  slug: string;
  shopName: string;
  /**
   * Read-only commission label from Settings → Commission Settings.
   * When omitted (e.g. rendered inside the dashboard embed), it is fetched
   * client-side instead.
   */
  commissionLabel?: string;
  /** Hide the standalone page title/back button when embedded in the dashboard. */
  embedded?: boolean;
  /**
   * Owner / SS System can browse every staff payslip and approve pay.
   * Staff (and other non-managers) only ever see their own payslip.
   */
  canManage?: boolean;
  /** Viewer's own display name — used to show their payslip when canManage is false. */
  selfName?: string;
  /** Viewer's own role/position label — shown on their own payslip. */
  selfRole?: string;
};

type CommissionRow = {
  method?: string | null;
  rate?: number | string | null;
  price?: number | string | null;
  staff_target?: string | null;
};

function commissionRowToLabel(rows: CommissionRow[]): string {
  if (!rows.length) return "—";
  const pick =
    rows.find((r) => (r.staff_target ?? "").toLowerCase() === "staff") ??
    rows.find((r) => (r.staff_target ?? "").toLowerCase() === "all") ??
    rows[0];
  if ((pick.method ?? "percent") === "flat") {
    return `$${Number(pick.price) || 0}/session`;
  }
  return `${Number(pick.rate) || 0}%`;
}

const STAFF_LIST = [
  { id: "EMP-0042", name: "Jenny Smith", role: "Therapist", avatar: "J" },
  { id: "EMP-0043", name: "Ann Lee", role: "Therapist", avatar: "A" },
  { id: "EMP-0044", name: "Sam Wong", role: "Therapist", avatar: "S" },
];

const WEEKLY_OPTIONS = [
  { label: "Jun 8 – Jun 14, 2026 (This week)", value: "Jun 8 – Jun 14, 2026" },
  { label: "Jun 1 – Jun 7, 2026", value: "Jun 1 – Jun 7, 2026" },
  { label: "May 25 – May 31, 2026", value: "May 25 – May 31, 2026" },
  { label: "May 18 – May 24, 2026", value: "May 18 – May 24, 2026" },
];

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

const ROLE_LABELS: Record<string, string> = {
  ss_system: "SS System",
  owner: "Owner",
  manager: "Manager",
  reception: "Receptionist",
  staff: "Therapist",
};

export default function PayrollClient({
  slug,
  shopName,
  commissionLabel,
  embedded = false,
  canManage = true,
  selfName,
  selfRole,
}: PayrollClientProps) {
  const [commLabel, setCommLabel] = useState(commissionLabel ?? "—");
  const [period, setPeriod] = useState<PeriodType>("weekly");
  const [selectedStaff, setStaff] = useState(STAFF_LIST[0]);

  // Staff (non-managers) are locked to their own payslip only.
  const selfStaff = {
    id: "EMP-ME",
    name: selfName?.trim() || "You",
    role: selfRole ? ROLE_LABELS[selfRole] ?? selfRole : "Therapist",
    avatar: (selfName?.trim() || "Y").charAt(0).toUpperCase(),
  };
  const displayStaff = canManage ? selectedStaff : selfStaff;
  const [dailyDate, setDailyDate] = useState("2026-06-12");
  const [weeklyVal, setWeekly] = useState(WEEKLY_OPTIONS[0].value);
  const [monthVal, setMonth] = useState("2026-06");
  const [yearVal, setYear] = useState("2026");
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (commissionLabel !== undefined) {
      setCommLabel(commissionLabel);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("commissions")
          .select("method,rate,price,staff_target");
        if (!cancelled) setCommLabel(commissionRowToLabel((data ?? []) as CommissionRow[]));
      } catch {
        if (!cancelled) setCommLabel("—");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [commissionLabel]);

  function chipLabel() {
    if (period === "daily") {
      const d = new Date(dailyDate);
      return (
        "📅 " +
        d.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      );
    }
    if (period === "weekly") return "📅 " + weeklyVal;
    if (period === "monthly") {
      const [y, m] = monthVal.split("-");
      return "📅 " + MONTH_NAMES[parseInt(m, 10) - 1] + " " + y;
    }
    return "📅 Year " + yearVal;
  }

  // Mock figures — wire to Supabase aggregates later.
  const income = { base: 1200, commission: 850, tips: 320, bonus: 100 };
  const gross = income.base + income.commission + income.tips + income.bonus;
  const stats = { clients: 82, hours: 126, tips: 540, commission: 850 };

  const periodValue = chipLabel().replace("📅 ", "");
  const generatedOn = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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
              value={STAFF_LIST.findIndex((s) => s.id === selectedStaff.id)}
              onChange={(e) => setStaff(STAFF_LIST[parseInt(e.target.value, 10)])}
            >
              {STAFF_LIST.map((s, i) => (
                <option key={s.id} value={i}>
                  {s.name} — {s.role}
                </option>
              ))}
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
                <span className="pp-note">· week starts Monday (set by Owner)</span>
              </label>
              <select
                className="filter-select"
                value={weeklyVal}
                onChange={(e) => setWeekly(e.target.value)}
              >
                {WEEKLY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
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
                {["2026", "2025", "2024"].map((y) => (
                  <option key={y}>{y}</option>
                ))}
              </select>
            </div>
          )}
          <div className="pay-period-chip">{chipLabel()}</div>
        </div>

        <div className="payslip">
          <div className="payslip-header">
            <div className="psh-left">
              <div className="psh-avatar">{displayStaff.avatar}</div>
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
              <div className="ps-section-title">💰 Income</div>
              <div className="ps-row">
                <span>Base Payment</span>
                <span className="amt">${income.base.toFixed(2)}</span>
              </div>
              <div className="ps-row">
                <span>
                  Service Commission
                  <span className="comm-method-tag">{commLabel}</span>
                </span>
                <span className="amt">${income.commission.toFixed(2)}</span>
              </div>
              <div className="ps-row">
                <span>Tips</span>
                <span className="amt">${income.tips.toFixed(2)}</span>
              </div>
              <div className="ps-row">
                <span>Bonus</span>
                <span className="amt">${income.bonus.toFixed(2)}</span>
              </div>
              <div className="ps-row subtotal">
                <span>Gross Pay</span>
                <span className="amt">${gross.toFixed(2)}</span>
              </div>
            </div>

            <div className="netpay-card">
              <div className="np-left">
                <div className="np-breakdown">
                  <div className="np-item">
                    <span className="np-item-label">Total Income</span>
                    <span className="np-item-val">${gross.toFixed(2)}</span>
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
                <div className="np-value">${gross.toFixed(2)}</div>
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
            <div>Generated {generatedOn} · Payslip #PS-2026-0612</div>
          </div>
        </div>
      </div>
    </div>
  );
}
