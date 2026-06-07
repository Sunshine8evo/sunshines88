"use client";

import { useEffect, useState } from "react";

import { formatClock, initials, roleLabel } from "@/lib/dashboard/utils";

type TopbarProps = {
  userName: string;
  role: string | undefined;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onMobileMenu: () => void;
  live?: boolean;
};

export default function Topbar({
  userName,
  role,
  theme,
  onToggleTheme,
  onMobileMenu,
  live = true,
}: TopbarProps) {
  const [clock, setClock] = useState(() => formatClock());

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 10_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="sd-topbar">
      <div className="sd-topbar-left">
        <button type="button" className="sd-mobile-menu-btn" onClick={onMobileMenu} aria-label="Open menu">
          ☰
        </button>
        {live ? <div className="sd-live-dot" title="Live updates" /> : null}
        <div className="sd-page-title">Dashboard</div>
      </div>
      <div className="sd-topbar-right">
        <div className="sd-datetime">{clock}</div>
        <button
          type="button"
          className="sd-theme-toggle"
          onClick={onToggleTheme}
          title="Toggle theme"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? "☀️" : "🌓"}
        </button>
        <div className="sd-user-btn">
          <div className="sd-user-avatar">{initials(userName)}</div>
          <span className="sd-user-name">
            {userName} · {roleLabel(role)}
          </span>
        </div>
      </div>
    </div>
  );
}
