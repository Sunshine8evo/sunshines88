"use client";

import { useEffect, useState } from "react";

import type { Tenant } from "@/lib/tenants/types";

type ClientsBusinessPanelProps = {
  currentSlug: string;
};

export default function ClientsBusinessPanel({ currentSlug }: ClientsBusinessPanelProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/tenants");
        if (!res.ok) throw new Error("Failed to load shops");
        const data = (await res.json()) as { tenants: Tenant[] };
        if (!cancelled) setTenants(data.tenants ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load shops");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="sd-embed-native-loading">Loading shops…</div>;
  }

  if (error) {
    return <div className="sd-embed-native-error">{error}</div>;
  }

  if (tenants.length === 0) {
    return (
      <div className="sd-embed-native-empty">
        No shops yet. New sign-ups from the landing page will appear here.
      </div>
    );
  }

  return (
    <div className="sd-clients-business">
      <table className="sd-clients-business-table">
        <thead>
          <tr>
            <th>Shop</th>
            <th>Slug</th>
            <th>Owner</th>
            <th>Plan</th>
            <th>Quick access</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className={t.slug === currentSlug ? "current" : undefined}>
              <td className="shop-name">{t.shop_name}</td>
              <td className="slug">{t.slug}</td>
              <td>{t.owner_email}</td>
              <td className="capitalize">{t.plan}</td>
              <td>
                <div className="sd-clients-business-links">
                  <a href={`/dashboard-${t.slug}`}>Dashboard</a>
                  <a href={`/dashboard-${t.slug}#calendar`}>Calendar</a>
                  <a href={`/dashboard-${t.slug}#queue`}>Queue</a>
                  <a href={`/dashboard-${t.slug}#clients`}>Clients</a>
                  <a href={`/dashboard-${t.slug}#employee-profile`}>Employees</a>
                  <a href={`/dashboard-${t.slug}#setting`}>Settings</a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
