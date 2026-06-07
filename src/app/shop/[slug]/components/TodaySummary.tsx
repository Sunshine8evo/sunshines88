"use client";

import Link from "next/link";

import type { TodayTurn } from "@/lib/dashboard/types";
import { formatMoney } from "@/lib/dashboard/utils";

type TodaySummaryProps = {
  slug: string;
  turns: TodayTurn[];
  loading?: boolean;
};

export default function TodaySummary({ slug, turns, loading }: TodaySummaryProps) {
  const totalHours = turns.reduce((s, t) => s + t.hours, 0);
  const totalTips = turns.reduce((s, t) => s + t.tips, 0);
  const totalCommission = turns.reduce((s, t) => s + t.commission, 0);
  const totalAmount = turns.reduce((s, t) => s + t.total, 0);

  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <div className="sd-card-title">
          <span>👤</span> Today Summary
        </div>
        <Link href={`/dashboard-${slug}/reports`} className="sd-view-all">
          View all →
        </Link>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ minWidth: 440 }}>
          <div className="sd-staff-summary-row header">
            <span>#</span>
            <span>Time</span>
            <span>Hrs</span>
            <span>Client</span>
            <span>Tips</span>
            <span>Commission (Add-on)</span>
            <span>Total ($)</span>
          </div>

          {loading ? (
            <div className="sd-no-queue">Loading…</div>
          ) : turns.length === 0 ? (
            <div className="sd-no-queue">No completed turns today</div>
          ) : (
            turns.map((turn) => (
              <div key={turn.turn} className="sd-staff-summary-row">
                <span style={{ fontWeight: 600, color: "var(--gold)" }}>{turn.turn}</span>
                <span className="sd-amount" style={{ fontSize: 11 }}>
                  {turn.time}
                </span>
                <span>{turn.hours}</span>
                <span>{turn.clientName}</span>
                <span className="sd-amount">{formatMoney(turn.tips)}</span>
                <span className="sd-amount">{formatMoney(turn.commission)}</span>
                <span className="sd-amount">{formatMoney(turn.total)}</span>
              </div>
            ))
          )}

          {turns.length > 0 ? (
            <div className="sd-staff-total-row">
              <span>—</span>
              <span>Total</span>
              <span>{totalHours % 1 === 0 ? `${totalHours}h` : `${totalHours.toFixed(1)}h`}</span>
              <span>{turns.length} clients</span>
              <span className="sd-amount">{formatMoney(totalTips)}</span>
              <span className="sd-amount">{formatMoney(totalCommission)}</span>
              <span className="sd-amount" style={{ fontSize: 13 }}>
                {formatMoney(totalAmount)}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
