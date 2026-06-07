"use client";

import type { CSSProperties, ReactNode } from "react";

type HardNavLinkProps = {
  href: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * Full-page navigation for /public/*.html and other routes outside the App Router.
 * Uses <button> because Next.js intercepts <a> clicks before onClick can run.
 */
export default function HardNavLink({
  href,
  className,
  style,
  children,
}: HardNavLinkProps) {
  return (
    <button
      type="button"
      className={className}
      style={style}
      onClick={() => {
        window.location.assign(href);
      }}
    >
      {children}
    </button>
  );
}
