"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { aggregateSales, pct } from "@/lib/sales/aggregateSales";
import { fetchSalesData } from "@/lib/sales/fetchSalesData";
import type { SalesAggregate, SalesPeriod } from "@/lib/sales/types";
import { createClient } from "@/lib/supabase/client";

import IdleLogout from "../components/IdleLogout";

import "./sales.css";

type SalesClientProps = {
  slug: string;
  shopName: string;
  embedded?: boolean;
};

const PERIODS: SalesPeriod[] = ["daily", "weekly", "monthly", "yearly"];

export default function SalesClient({ slug, shopName, embedded = false }: SalesClientProps) {
  const [period, setPeriod] = useState<SalesPeriod>("weekly");
  const [dateRef, setDateRef] = useState(() => new Date().toISOString().slice(0, 10));
  const [data, setData] = useState<SalesAggregate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const pieRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLCanvasElement>(null);
  const pieChart = useRef<{ destroy: () => void } | null>(null);
  const barChart = useRef<{ destroy: () => void } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const supabase = createClient();
      const raw = await fetchSalesData(supabase, period, dateRef);
      setData(aggregateSales(raw.bookings, raw.payroll, period, dateRef));
    } catch (e) {
      console.error("SalesClient load:", e);
      setData(null);
      setError("Unable to load sales data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [period, dateRef]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data || !pieRef.current || !barRef.current) return;

    let cancelled = false;

    (async () => {
      const { default: Chart } = await import("chart.js/auto");
      if (cancelled) return;

      pieChart.current?.destroy();
      barChart.current?.destroy();

      pieChart.current = new Chart(pieRef.current!, {
        type: "doughnut",
        data: {
          labels: ["Service revenue", "Add-on revenue", "Tips"],
          datasets: [
            {
              data: [data.svcRev, data.addonRev, data.tipRev],
              backgroundColor: ["#EF9F27", "#1D9E75", "#7F77DD"],
              borderWidth: 2,
              borderColor: "#ffffff",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) =>
                  ` ${ctx.label}: $${Math.round(ctx.raw as number).toLocaleString()}`,
              },
            },
          },
        },
      });

      barChart.current = new Chart(barRef.current!, {
        type: "bar",
        data: {
          labels: data.timeSeries.labels,
          datasets: [
            {
              label: "Revenue",
              data: data.timeSeries.revenue,
              backgroundColor: "#EF9F27",
            },
            {
              label: "Staff payout",
              data: data.timeSeries.payout,
              backgroundColor: "#F09595",
            },
            {
              label: "Net profit",
              data: data.timeSeries.profit,
              backgroundColor: "#97C459",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: {
              ticks: { font: { size: 11 }, autoSkip: false, maxRotation: 0 },
              grid: { display: false },
            },
            y: {
              ticks: {
                callback: (v) => `$${Number(v).toLocaleString()}`,
                font: { size: 11 },
              },
            },
          },
        },
      });
    })();

    return () => {
      cancelled = true;
      pieChart.current?.destroy();
      barChart.current?.destroy();
      pieChart.current = null;
      barChart.current = null;
    };
  }, [data]);

  const f = (n: number) => `$${Math.round(n).toLocaleString()}`;
  const AVATAR_COLORS = ["#FAC775", "#EF9F27", "#854F0B", "#1D9E75"];
  const AVATAR_TC = ["#633806", "#412402", "#fdf6e3", "#04342C"];

  if (loading) {
    return <div className="sales-page sales-loading">Loading sales data…</div>;
  }

  if (error || !data) {
    return <div className="sales-page sales-loading">{error || "No data found."}</div>;
  }

  return (
    <div className={`sales-page${embedded ? " sales-page--embedded" : ""}`}>
      {!embedded && <IdleLogout timeoutMinutes={30} />}

      <div className="sales-topbar">
        <div>
          {!embedded && (
            <button
              type="button"
              className="sales-back"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else window.location.assign(`/dashboard-${slug}`);
              }}
              aria-label="Back to dashboard"
            >
              ←
            </button>
          )}
          <div className="sales-title">Sales summary</div>
          <div className="sales-sub">
            {shopName} · {slug}
          </div>
        </div>
        <div className="sales-controls">
          <input
            type="date"
            className="sales-date"
            value={dateRef}
            onChange={(e) => setDateRef(e.target.value)}
            aria-label="Reference date"
          />
          <div className="period-tabs">
            {PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                className={`ptab${period === p ? " on" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <div className="m-label">Total revenue</div>
          <div className="m-val">{f(data.totalRev)}</div>
        </div>
        <div className="metric">
          <div className="m-label">Add-on revenue</div>
          <div className="m-val">
            {f(data.addonRev)}
            <span className="m-badge up">{pct(data.addonRev, data.totalRev)}%</span>
          </div>
        </div>
        <div className="metric">
          <div className="m-label">Total staff payout</div>
          <div className="m-val red">
            {f(data.totalPayout)}
            <span className="m-badge dn">{pct(data.totalPayout, data.totalRev)}%</span>
          </div>
        </div>
        <div className="metric">
          <div className="m-label">Net profit</div>
          <div className="m-val green">
            {f(data.netProfit)}
            <span className="m-badge up">Margin {data.margin}%</span>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="card">
          <div className="card-title">Revenue breakdown</div>
          <div className="pie-row">
            <div className="pie-canvas-wrap">
              <canvas ref={pieRef} role="img" aria-label="Revenue breakdown chart" />
            </div>
            <div className="pie-detail">
              {[
                { label: "Service revenue", color: "#EF9F27", val: data.svcRev },
                { label: "Add-on revenue", color: "#1D9E75", val: data.addonRev },
                { label: "Tips", color: "#7F77DD", val: data.tipRev },
              ].map((item) => (
                <div key={item.label} className="pie-stat">
                  <span className="pie-stat-label">
                    <span className="leg-dot" style={{ background: item.color }} />
                    {item.label}
                  </span>
                  <span>
                    {f(item.val)}{" "}
                    <span className="muted">{pct(item.val, data.totalRev)}%</span>
                  </span>
                </div>
              ))}
              <div className="pie-stat total">
                <span>Total</span>
                <span>{f(data.totalRev)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Revenue vs staff payout</div>
          <div className="legend">
            <span className="li">
              <span className="leg-dot" style={{ background: "#EF9F27" }} />
              Revenue
            </span>
            <span className="li">
              <span className="leg-dot" style={{ background: "#F09595" }} />
              Staff payout
            </span>
            <span className="li">
              <span className="leg-dot" style={{ background: "#97C459" }} />
              Net profit
            </span>
          </div>
          <div className="bar-canvas-wrap">
            <canvas ref={barRef} role="img" aria-label="Revenue vs payout bar chart" />
          </div>
        </div>
      </div>

      <div className="card card-spaced">
        <div className="card-title">Service &amp; add-on breakdown</div>
        {data.services.length === 0 && data.addons.length === 0 ? (
          <p className="sales-empty">No completed bookings in this period.</p>
        ) : (
          <table className="svc-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Type</th>
                <th>Sessions</th>
                <th>Revenue</th>
                <th>Avg/session</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {data.services.map((s) => (
                <tr key={`svc-${s.name}`}>
                  <td>
                    <span className="dot" style={{ background: s.color }} />
                    {s.name}
                  </td>
                  <td className="muted">Service</td>
                  <td>{s.sessions}</td>
                  <td>{f(s.revenue)}</td>
                  <td>{f(Math.round(s.revenue / Math.max(1, s.sessions)))}</td>
                  <td>{pct(s.revenue, data.totalRev)}%</td>
                </tr>
              ))}
              {data.addons.map((a) => (
                <tr key={`addon-${a.name}`}>
                  <td>
                    <span className="dot" style={{ background: a.color }} />
                    {a.name}
                  </td>
                  <td className="addon-type">Add-on</td>
                  <td>{a.sessions}</td>
                  <td>{f(a.revenue)}</td>
                  <td>{f(Math.round(a.revenue / Math.max(1, a.sessions)))}</td>
                  <td>{pct(a.revenue, data.totalRev)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card card-spaced">
        <div className="card-title">Staff payout — full breakdown</div>
        {data.staffPayout.length === 0 ? (
          <p className="sales-empty">No staff payouts in this period.</p>
        ) : (
          data.staffPayout.map((s, i) => (
            <div key={s.id} className="staff-row">
              <div className="staff-head">
                <div className="staff-left">
                  <div
                    className="staff-av"
                    style={{
                      background: AVATAR_COLORS[i % 4],
                      color: AVATAR_TC[i % 4],
                    }}
                  >
                    {s.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div>
                    <div className="staff-name">{s.name}</div>
                    <div className="staff-role">{s.role}</div>
                  </div>
                </div>
                <div className="staff-total">{f(s.total)}</div>
              </div>
              <div className="staff-breakdown">
                <div className="sb-item">
                  <div className="sb-label">Base pay</div>
                  <div className="sb-val">{f(s.base)}</div>
                </div>
                <div className="sb-item">
                  <div className="sb-label">Commission</div>
                  <div className="sb-val">{f(s.comm)}</div>
                </div>
                <div className="sb-item">
                  <div className="sb-label">Add-on comm</div>
                  <div className="sb-val">{f(s.addonComm)}</div>
                </div>
                <div className="sb-item">
                  <div className="sb-label">Tip credit</div>
                  <div className="sb-val">{f(s.tip)}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pnl-card">
        <div className="card-title">Profit &amp; loss summary</div>
        {[
          { label: "Service revenue", val: data.svcRev, plus: true },
          { label: "Add-on revenue", val: data.addonRev, plus: true },
          { label: "Tips collected", val: data.tipRev, plus: true },
          { label: "Total revenue", val: data.totalRev, plus: true, total: true },
          { label: "Base pay", val: data.totalBase, plus: false },
          { label: "Commission paid", val: data.totalComm, plus: false },
          { label: "Add-on commission", val: data.totalAddonC, plus: false },
          { label: "Tip credit paid", val: data.totalTipC, plus: false },
          { label: "Total staff payout", val: data.totalPayout, plus: false, total: true },
        ].map((row) => (
          <div key={row.label} className={`pnl-row${row.total ? " pnl-total" : ""}`}>
            <span className="pnl-label">{row.label}</span>
            <span className={row.plus ? "green" : "red"}>
              {row.plus ? "" : "-"}
              {f(row.val)}
            </span>
          </div>
        ))}
        <div className="pnl-row pnl-net">
          <span>Net profit</span>
          <span className="green pnl-net-val">{f(data.netProfit)}</span>
        </div>
      </div>
    </div>
  );
}
