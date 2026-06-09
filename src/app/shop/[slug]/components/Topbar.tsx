"use client";

import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";
import { initials, roleLabel } from "@/lib/dashboard/utils";

type TopbarProps = {
  shopName: string;
  shopAddress?: string;
  shopLogoUrl?: string | null;
  userName: string;
  role: string | undefined;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onMobileMenu: () => void;
  /** SS System home at /dashboard — show Sunshine logo instead of user controls */
  systemHome?: boolean;
  live?: boolean;
};

export default function Topbar({
  shopName,
  shopAddress,
  shopLogoUrl,
  userName,
  role,
  theme,
  onToggleTheme,
  onMobileMenu,
  systemHome = false,
  live = true,
}: TopbarProps) {
  return (
    <div className="sd-topbar">
      <div className="sd-topbar-left">
        <button type="button" className="sd-mobile-menu-btn" onClick={onMobileMenu} aria-label="Open menu">
          ☰
        </button>
        {live ? <div className="sd-live-dot" title="Live updates" /> : null}
        <div className="sd-topbar-biz">
          <div className="sd-topbar-biz-logo">
            {shopLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={shopLogoUrl} alt="" className="sd-topbar-biz-img" />
            ) : (
              initials(shopName)
            )}
          </div>
          <div className="sd-topbar-biz-text">
            <div className="sd-topbar-biz-name">{shopName}</div>
            {shopAddress ? <div className="sd-topbar-biz-addr">📍 {shopAddress}</div> : null}
          </div>
        </div>
      </div>
      <div className="sd-topbar-right">
        {systemHome ? (
          <a href="/dashboard" className="sd-topbar-sunshine-logo" title="Sunshine Booking System">
            <SunshineBrandLogo width={132} className="sd-topbar-sunshine-img" />
          </a>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
