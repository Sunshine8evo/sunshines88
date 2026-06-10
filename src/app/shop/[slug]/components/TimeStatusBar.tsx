"use client";

import { useEffect, useState } from "react";

type Phase = "upcoming" | "start" | "half" | "left15" | "done";

type TimeStatusBarProps = {
  /** Session start in minutes from midnight (h*60+m) */
  startMinutes: number;
  durationMinutes: number;
  /** Raw booking status: pending | confirm | inservice | delay | done | cancel */
  status: string;
};

const COMPLETED_STATUSES = new Set(["done", "completed", "cancel"]);

function compute(startMinutes: number, durationMinutes: number, status: string) {
  const now = new Date();
  const nowMs = now.getTime();
  const start = new Date();
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  const startMs = start.getTime();
  const endMs = startMs + durationMinutes * 60000;

  if (COMPLETED_STATUSES.has(status) || nowMs >= endMs) {
    return { progress: 100, phase: "done" as Phase, label: "Completed" };
  }

  if (nowMs < startMs) {
    return { progress: 0, phase: "upcoming" as Phase, label: "Upcoming" };
  }

  const total = durationMinutes * 60000;
  const pct = Math.min(100, Math.round(((nowMs - startMs) / total) * 100));
  const minutesLeft = Math.ceil((endMs - nowMs) / 60000);

  if (minutesLeft <= 15) {
    return { progress: pct, phase: "left15" as Phase, label: `Left ${minutesLeft} min` };
  }
  if (pct >= 40) {
    return { progress: pct, phase: "half" as Phase, label: "Half Session" };
  }
  return { progress: pct, phase: "start" as Phase, label: "Start Session" };
}

export default function TimeStatusBar({
  startMinutes,
  durationMinutes,
  status,
}: TimeStatusBarProps) {
  const [state, setState] = useState<{ progress: number; phase: Phase; label: string }>({
    progress: 0,
    phase: "upcoming",
    label: "",
  });

  useEffect(() => {
    const update = () => setState(compute(startMinutes, durationMinutes, status));
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, [startMinutes, durationMinutes, status]);

  return (
    <div className="time-status-wrap">
      <div className={`time-status-bar ${state.phase}`}>
        <div className="tsb-segments" aria-hidden>
          <span className="tsb-seg" />
          <span className="tsb-seg" />
          <span className="tsb-seg" />
          <span className="tsb-seg" />
        </div>
        <div className="tsb-fill" style={{ width: `${state.progress}%` }} />
      </div>
      <span className={`time-status-label ${state.phase}`}>{state.label}</span>
    </div>
  );
}
