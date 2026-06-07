"use client";

import { useState } from "react";

import { dashboardHashHref } from "@/lib/dashboard/constants";
import type { SalePeriod, SaleSummaryData } from "@/lib/dashboard/types";
import { formatMoney } from "@/lib/dashboard/utils";

type SaleSummaryProps = {
  slug: string;
  dashboardBase: string;
  data: SaleSummaryData;
  loading?: boolean;
  onPeriodChange: (period: SalePeriod) => void;
};

const TABS: { key: SalePeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

export default function SaleSummary({
  slug,
  dashboardBase,
  data,
  loading,
  onPeriodChange,
}: SaleSummaryProps) {
  const [activeTab, setActiveTab] = useState<SalePeriod>("today");

  function switchTab(period: SalePeriod) {
    setActiveTab(period);
    onPeriodChange(period);
  }

  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <div className="sd-card-title">
          <span>📈</span> Sale Summary
        </div>
        <a href={dashboardHashHref(dashboardBase, "salesummary")} className="sd-view-all">
          View all Sale Summary →
        </a>
      </div>

      <div className="sd-summary-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`sd-stab${activeTab === tab.key ? " active" : ""}`}
            onClick={() => switchTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="sd-no-queue">Loading sales…</div>
      ) : (
        <>
          <div className="sd-sale-grid">
            <div className="sd-sale-stat">
              <div className="ss-label">Clients</div>
              <div className="ss-val">{data.clientCount}</div>
            </div>
            <div className="sd-sale-stat">
              <div className="ss-label">Revenue</div>
              <div className="ss-val">{formatMoney(data.revenue)}</div>
            </div>
          </div>

          <div className="sd-gold-divider" />

          <table className="sd-sale-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Services</th>
                <th>Add-ons</th>
                <th>Tips</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <span className="sd-payment-badge cash">💵 Cash</span>
                </td>
                <td className="sd-amount">{formatMoney(data.cash.services)}</td>
                <td className="sd-amount">{formatMoney(data.cash.addons)}</td>
                <td className="sd-amount">{formatMoney(data.cash.tips)}</td>
                <td className="sd-amount">
                  <strong>{formatMoney(data.cash.total)}</strong>
                </td>
              </tr>
              <tr>
                <td>
                  <span className="sd-payment-badge card">💳 Card</span>
                </td>
                <td className="sd-amount">{formatMoney(data.card.services)}</td>
                <td className="sd-amount">{formatMoney(data.card.addons)}</td>
                <td className="sd-amount">{formatMoney(data.card.tips)}</td>
                <td className="sd-amount">
                  <strong>{formatMoney(data.card.total)}</strong>
                </td>
              </tr>
              <tr className="sd-sale-total-row">
                <td style={{ color: "var(--text)" }}>Total</td>
                <td className="sd-amount">
                  <strong>{formatMoney(data.grand.services)}</strong>
                </td>
                <td className="sd-amount">
                  <strong>{formatMoney(data.grand.addons)}</strong>
                </td>
                <td className="sd-amount">
                  <strong>{formatMoney(data.grand.tips)}</strong>
                </td>
                <td className="sd-amount" style={{ fontSize: 13 }}>
                  <strong>{formatMoney(data.grand.total)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
