"use client";

import { useState } from "react";

import Link from "next/link";

import type { PayrollPeriod, StaffPayroll } from "@/lib/dashboard/types";
import { formatMoney, initials } from "@/lib/dashboard/utils";

type PayrollSummaryProps = {
  slug: string;
  ownerView: boolean;
  staffName: string;
  staff: StaffPayroll[];
  grand: StaffPayroll | null;
  periodLabel: string;
  loading?: boolean;
  showPreviewToggle?: boolean;
  previewStaff?: boolean;
  previewStaffLabel?: string;
  onPreviewChange?: (asStaff: boolean) => void;
  onPeriodChange: (period: PayrollPeriod) => void;
};

const OWNER_TABS: { key: PayrollPeriod; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const STAFF_TABS: { key: PayrollPeriod; label: string }[] = [
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function PayrollSummary({
  slug,
  ownerView,
  staffName,
  staff,
  grand,
  periodLabel,
  loading,
  showPreviewToggle,
  previewStaff,
  previewStaffLabel = "Staff",
  onPreviewChange,
  onPeriodChange,
}: PayrollSummaryProps) {
  const tabs = ownerView ? OWNER_TABS : STAFF_TABS;
  const [activeTab, setActiveTab] = useState<PayrollPeriod>(ownerView ? "daily" : "weekly");
  const [openStaff, setOpenStaff] = useState<string | null>(staff[0]?.id ?? null);

  function switchTab(period: PayrollPeriod) {
    setActiveTab(period);
    onPeriodChange(period);
  }

  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <div className="sd-card-title">
          <span>💰</span> Payroll Summary
          <span className="sd-tools-badge" style={{ fontSize: 9, background: "rgba(201,146,42,.15)", color: "var(--gold)" }}>
            {ownerView ? "SS + Owner" : "Staff"}
          </span>
        </div>
        <Link href={`/dashboard-${slug}/reports`} className="sd-view-all">
          View all Summary →
        </Link>
      </div>

      {showPreviewToggle ? (
        <div className="sd-role-preview">
          <span style={{ fontSize: 10, color: "var(--muted)" }}>Preview as:</span>
          <button
            type="button"
            className={`sd-role-btn${!previewStaff ? " active-role" : ""}`}
            onClick={() => onPreviewChange?.(false)}
          >
            SS / Owner
          </button>
          <button
            type="button"
            className={`sd-role-btn${previewStaff ? " active-role" : ""}`}
            onClick={() => onPreviewChange?.(true)}
          >
            Staff ({previewStaffLabel})
          </button>
        </div>
      ) : null}

      <div className="sd-payroll-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`sd-ptab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => switchTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="sd-payroll-date">
        <span className="sd-payroll-date-chip">{periodLabel}</span>
        {ownerView ? (
          <span style={{ fontSize: 10, color: "var(--muted)" }}>
            (excl. Manager, Receptionist, Cleaner)
          </span>
        ) : null}
      </div>
      <div className="sd-gold-divider" />

      {loading ? (
        <div className="sd-no-queue">Loading payroll…</div>
      ) : ownerView ? (
        <>
          {staff.length === 0 ? (
            <div className="sd-no-queue">No payroll data for this period</div>
          ) : (
            staff.map((member) => (
              <div key={member.id} className="sd-staff-payroll-block">
                <button
                  type="button"
                  className={`sd-staff-payroll-header${openStaff === member.id ? " open" : ""}`}
                  onClick={() => setOpenStaff(openStaff === member.id ? null : member.id)}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div className="sd-spb-avatar">{initials(member.name)}</div>
                    <span className="sd-spb-name">{member.name}</span>
                    <span className="sd-spb-role">{member.role}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span className="sd-amount sd-spb-name">{formatMoney(member.total)}</span>
                    <span className="sd-spb-chevron">▾</span>
                  </div>
                </button>
                <div className={`sd-staff-payroll-detail${openStaff === member.id ? " open" : ""}`}>
                  <PayrollTable rows={member.rows} totals={member} />
                </div>
              </div>
            ))
          )}

          {grand && staff.length > 0 ? (
            <div className="sd-grand-total">
              <span>Grand Total ({staff.length} Staff)</span>
              <span className="sd-amount">{grand.totalHours} hrs</span>
              <span className="sd-amount">{formatMoney(grand.totalCommission)}</span>
              <span className="sd-amount">{formatMoney(grand.totalTip)}</span>
              <span className="sd-amount" style={{ fontSize: 13 }}>
                {formatMoney(grand.total)}
              </span>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="sd-payroll-date" style={{ marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
              {staffName}&apos;s Payroll
            </span>
            <span className="sd-payroll-date-chip">{periodLabel}</span>
          </div>
          {staff[0] ? (
            <PayrollTable rows={staff[0].rows} totals={staff[0]} />
          ) : (
            <div className="sd-no-queue">No payroll data for this period</div>
          )}
        </>
      )}
    </div>
  );
}

function PayrollTable({
  rows,
  totals,
}: {
  rows: StaffPayroll["rows"];
  totals: Pick<StaffPayroll, "totalHours" | "totalCommission" | "totalTip" | "total">;
}) {
  return (
    <table className="sd-sum-table" style={{ marginTop: 4 }}>
      <thead>
        <tr>
          <th>Day</th>
          <th>Hrs</th>
          <th>Commission</th>
          <th>Tip</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.day}>
            <td>{row.day}</td>
            <td>{row.hours}</td>
            <td className="sd-amount">{formatMoney(row.commission)}</td>
            <td className="sd-amount">{formatMoney(row.tip)}</td>
            <td className="sd-amount">{formatMoney(row.total)}</td>
          </tr>
        ))}
        <tr className="total-row">
          <td>
            <strong>Total</strong>
          </td>
          <td>
            <strong>{totals.totalHours}</strong>
          </td>
          <td className="sd-amount">
            <strong>{formatMoney(totals.totalCommission)}</strong>
          </td>
          <td className="sd-amount">
            <strong>{formatMoney(totals.totalTip)}</strong>
          </td>
          <td className="sd-amount">
            <strong>{formatMoney(totals.total)}</strong>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
