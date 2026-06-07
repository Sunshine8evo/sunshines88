import type { ReactNode } from "react";

import "./legal-footer.css";

type LegalFooterProps = {
  variant?: "default" | "dashboard" | "booking";
};

const LEGAL_LINKS = [
  { href: "/legal.html#terms", label: "Terms of Service" },
  { href: "/legal.html#privacy", label: "Privacy Policy" },
  { href: "/legal.html#refund", label: "Refund Policy" },
] as const;

export function LegalFooterLinks({ className = "" }: { className?: string }) {
  return (
    <nav
      className={`legal-footer-links${className ? ` ${className}` : ""}`}
      aria-label="Legal policies"
    >
      {LEGAL_LINKS.map((link) => (
        <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
          {link.label}
        </a>
      ))}
    </nav>
  );
}

function LegalFooterCopy({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={`legal-footer-copy${className ? ` ${className}` : ""}`}>{children}</p>;
}

export default function LegalFooter({ variant = "default" }: LegalFooterProps) {
  if (variant === "dashboard") {
    return (
      <footer className="dashboard-legal-footer">
        <LegalFooterLinks />
        <LegalFooterCopy>
          © 2026{" "}
          <span className="legal-footer-brand">Sunshine Evolution Technology</span>
        </LegalFooterCopy>
      </footer>
    );
  }

  if (variant === "booking") {
    return (
      <footer className="bf5-legal-footer">
        <LegalFooterLinks />
        <LegalFooterCopy>© 2026 Sunshine Evolution Technology</LegalFooterCopy>
      </footer>
    );
  }

  return (
    <footer className="legal-footer">
      <LegalFooterLinks />
      <LegalFooterCopy>
        © 2026 Sunshine Evolution Technology · sunshines88.com
      </LegalFooterCopy>
    </footer>
  );
}
