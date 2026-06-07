"use client";

import Link from "next/link";

import type { QueueItem } from "@/lib/dashboard/types";
import { formatDurationBadge } from "@/lib/dashboard/utils";

type QueueCardProps = {
  slug: string;
  items: QueueItem[];
  loading?: boolean;
};

export default function QueueCard({ slug, items, loading }: QueueCardProps) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <div className="sd-card-title">
          <span>⚡</span> Queue — Now &amp; Upcoming
        </div>
        <Link href={`/dashboard-${slug}/bookings`} className="sd-view-all">
          View all Queue →
        </Link>
      </div>

      <div className="sd-queue-wrap">
        <div className="sd-queue-row header">
          <span>Time</span>
          <span>Client</span>
          <span>Service</span>
          <span>Staff</span>
          <span />
        </div>

        {loading ? (
          <div className="sd-no-queue">Loading queue…</div>
        ) : items.length === 0 ? (
          <div className="sd-no-queue">No upcoming bookings today</div>
        ) : (
          items.map((item) => (
            <div
              key={item.id}
              className="sd-queue-row"
              style={item.status === "noshow" ? { opacity: 0.6 } : undefined}
            >
              <span>
                <span className={`sd-time-chip${item.status === "cancel" ? " muted" : ""}`}>
                  {item.time}
                  <span className="sd-dur-badge">{formatDurationBadge(item.durationMinutes)}</span>
                </span>
              </span>
              <span className="sd-client-name">{item.clientName}</span>
              <span>
                {item.services.map((svc) => (
                  <span key={svc} className="sd-svc-badge">
                    {svc}
                  </span>
                ))}
              </span>
              <span className="sd-staff-chip">
                {item.requested ? <span>★</span> : null}
                {item.staffName}
              </span>
              <span className={`sd-status-dot ${item.status}`} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
