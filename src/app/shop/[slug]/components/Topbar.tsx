"use client";

import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";
import { initials, roleLabel } from "@/lib/dashboard/utils";

type TopbarProps = {
  shopName: string;
  shopAddress?: string;
  shopLogoUrl?: string | null;
  showSunshineBrand?: boolean;
  userName: string;
  role: string | undefined;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onMobileMenu: () => void;
  live?: boolean;
};

export default function Topbar({
  shopName,
  shopAddress,
  shopLogoUrl,
  showSunshineBrand = false,
  userName,
  role,
  theme,
  onToggleTheme,
  onMobileMenu,
  live = true,
}: TopbarProps) {
  return (
    <div className="sd-topbar">
      <div className="sd-topbar-left">
        <button type="button" className="sd-mobile-menu-btn" onClick={onMobileMenu} aria-label="Open menu">
          ☰
        </button>
        {live ? <div className="sd-live-dot" title="Live updates" /> : null}
        {showSunshineBrand ? (
          <div className="sd-topbar-brand">
            <SunshineBrandLogo width={140} className="sd-topbar-brand-logo" />
          </div>
        ) : (
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
        )}
      </div>
      <div className="sd-topbar-right">
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
