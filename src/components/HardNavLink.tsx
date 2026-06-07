"use client";

import type { ReactNode, MouseEvent } from "react";

type HardNavLinkProps = {
  href: string;
  className?: string;
  children: ReactNode;
};

/** Full-page navigation — required for /public/*.html routes that Next.js client router blocks. */
export default function HardNavLink({ href, className, children }: HardNavLinkProps) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    window.location.assign(href);
  }

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}
