"use client";

import { dashboardHashHref } from "@/lib/dashboard/constants";
import type { QueueItem } from "@/lib/dashboard/types";
import { formatDurationBadge } from "@/lib/dashboard/utils";

type QueueCardProps = {
  slug: string;
  dashboardBase: string;
  items: QueueItem[];
  loading?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirm: "Confirmed",
  inservice: "In Service",
  delay: "Delay",
  done: "Done",
  cancel: "Cancel",
};

function statusLabel(raw: string): string {
  return STATUS_LABELS[raw] ?? raw.charAt(0).toUpperCase() + raw.slice(1);
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** Requested → ★ + name; no request & time not arrived → blank; otherwise show assigned staff */
function staffCell(item: QueueItem): React.ReactNode {
  if (item.requested && item.staffName) {
    return (
      <span className="sd-staff-chip">
        <span aria-hidden>★</span>
        {item.staffName}
      </span>
    );
  }
  if (!item.requested && nowMinutes() < item.startMinutes) {
    return null;
  }
  return item.staffName ? <span className="sd-staff-chip">{item.staffName}</span> : null;
}

export default function QueueCard({ slug, dashboardBase, items, loading }: QueueCardProps) {
  return (
    <div className="sd-card">
      <div className="sd-card-header">
        <div className="sd-card-title">
          <span>⚡</span> Queue — Now &amp; Upcoming
        </div>
        <a href={dashboardHashHref(dashboardBase, "queue")} className="sd-view-all">
          View all Queue →
        </a>
      </div>

      <div className="sd-queue-wrap">
        <div className="sd-queue-row header">
          <span>Booking / Dur.</span>
          <span>Time Status</span>
          <span>Clients</span>
          <span>Staff</span>
          <span>Room</span>
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
              <span>
                <span className={`sd-status-chip ${item.rawStatus}`}>
                  {statusLabel(item.rawStatus)}
                </span>
              </span>
              <span className="sd-queue-client">
                <span className="sd-client-name">{item.clientName}</span>
                <span className="sd-queue-services">
                  {item.service ? (
                    <span className="sd-svc-badge">{item.service}</span>
                  ) : null}
                  {item.addons.map((addon) => (
                    <span key={addon} className="sd-svc-badge addon">
                      +{addon}
                    </span>
                  ))}
                </span>
              </span>
              <span>{staffCell(item)}</span>
              <span className="sd-queue-room">{item.room || "—"}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
