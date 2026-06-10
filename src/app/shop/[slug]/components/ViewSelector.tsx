"use client";

import { useEffect, useRef, useState } from "react";

export type DashboardViewAs = "owner" | "manager" | "receptionist" | "staff";

const VIEW_LABELS: Record<DashboardViewAs, string> = {
  owner: "Owner View",
  manager: "Staff · Manager",
  receptionist: "Staff · Receptionist",
  staff: "Staff · Staff",
};

const STAFF_POSITIONS: { key: DashboardViewAs; label: string }[] = [
  { key: "manager", label: "Manager" },
  { key: "receptionist", label: "Receptionist" },
  { key: "staff", label: "Staff" },
];

type ViewSelectorProps = {
  value: DashboardViewAs;
  onChange: (next: DashboardViewAs) => void;
};

export default function ViewSelector({ value, onChange }: ViewSelectorProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function select(next: DashboardViewAs) {
    onChange(next);
    setOpen(false);
  }

  return (
    <div className="sd-view-wrap" ref={rootRef}>
      <button
        type="button"
        className="sd-lang-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="sd-lang-icon" aria-hidden>
          👁️
        </span>
        <span>{VIEW_LABELS[value]}</span>
        <span className="sd-lang-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="sd-lang-popup sd-view-popup" role="listbox" aria-label="Select view">
          <p className="sd-lang-popup-title">View as</p>
          <button
            type="button"
            role="option"
            aria-selected={value === "owner"}
            className={`sd-view-option${value === "owner" ? " on" : ""}`}
            onClick={() => select("owner")}
          >
            👑 Owner View
          </button>
          <p className="sd-view-group-label">Staff View — Position</p>
          {STAFF_POSITIONS.map((pos) => (
            <button
              key={pos.key}
              type="button"
              role="option"
              aria-selected={value === pos.key}
              className={`sd-view-option${value === pos.key ? " on" : ""}`}
              onClick={() => select(pos.key)}
            >
              👤 {pos.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
