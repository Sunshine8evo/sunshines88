import "./legal-footer.css";

type LegalFooterProps = {
  variant?: "default" | "dashboard" | "booking";
};

const LEGAL_LINKS = [
  { href: "/legal.html#terms", label: "Terms of Service" },
  { href: "/legal.html#privacy", label: "Privacy Policy" },
  { href: "/legal.html#refund", label: "Refund Policy" },
] as const;

export function LegalFooterLinks({
  divider = "·",
  className = "",
}: {
  divider?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {LEGAL_LINKS.map((link, i) => (
        <span key={link.href}>
          {i > 0 ? (
            <span className="legal-divider" aria-hidden>
              {divider}
            </span>
          ) : null}
          <a href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        </span>
      ))}
    </span>
  );
}

export default function LegalFooter({ variant = "default" }: LegalFooterProps) {
  if (variant === "dashboard") {
    return (
      <div className="dashboard-legal-footer">
        {LEGAL_LINKS.map((link) => (
          <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ))}
        <span className="dashboard-legal-copy">
          © 2026 Sunshine Evolution Technology
        </span>
      </div>
    );
  }

  if (variant === "booking") {
    return (
      <div className="bf5-legal-footer">
        <LegalFooterLinks divider="·" />
        <div style={{ marginTop: 4, fontSize: 10, color: "#c5bfc8" }}>
          © 2026 Sunshine Evolution Technology
        </div>
      </div>
    );
  }

  return (
    <footer className="legal-footer">
      <LegalFooterLinks />
      <span className="legal-copy">
        © 2026 Sunshine Evolution Technology · sunshines88.com
      </span>
    </footer>
  );
}
