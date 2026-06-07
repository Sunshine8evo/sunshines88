"use client";

import Link from "next/link";
import { useState } from "react";

import PaymentForm from "@/components/billing/PaymentForm";
import { fmtPhoneInput } from "@/components/booking/booking-flow-v5-data";

import "./sunshine-landing.css";
import { LegalFooterLinks } from "./LegalFooter";
import SunshineNavLogo from "./SunshineNavLogo";

const FEATURES = [
  { icon: "📅", title: "24/7 Online Booking", desc: "Accept bookings anytime from any device" },
  { icon: "🔔", title: "Auto Confirm & Reminders", desc: "Reduce no-shows with smart alerts" },
  { icon: "📋", title: "Digital Intake Forms", desc: "Collect customer info effortlessly" },
  { icon: "👥", title: "Queue Management", desc: "Keep customers informed in real-time" },
  { icon: "📊", title: "Powerful Reports", desc: "Track performance and grow your business" },
  { icon: "🔒", title: "Secure & Reliable", desc: "Enterprise-grade security for your data" },
];

const PLANS = [
  {
    id: "Essential",
    price: "299",
    txFee: "Transaction Fee 2%",
    txZero: false,
    features: [
      "Online Booking",
      "Auto Confirm & Reminders",
      "Digital Intake Forms",
      "Queue Screen",
      "Staff Management",
      "Payroll Summary",
      "Sales Summary",
      "Basic Reports",
    ],
    seats: (
      <>
        <strong>1 Owner</strong>
        <br />
        1 Manager OR 1 Receptionist
        <br />
        3 Staff Included (Up to 8 Staff)
        <div className="sl-add-staff">Additional Staff: $5/month per staff</div>
      </>
    ),
    btnClass: "sl-plan-btn sl-plan-btn-outline",
  },
  {
    id: "Professional",
    price: "349",
    txFee: "Transaction Fee 1%",
    txZero: false,
    popular: true,
    extraLabel: "Everything in Essential, plus:",
    features: [
      "Advanced Payroll",
      "Payroll Settings",
      "Commission Rules",
      "Service Performance Reports",
      "Add-on Performance Reports",
      "Detailed Sales Analytics",
      "Manager + Receptionist",
    ],
    seats: (
      <>
        <strong>1 Owner · 1 Manager · 1 Receptionist</strong>
        <br />
        12 Staff Included (Up to 20 Staff)
        <div className="sl-add-staff">Additional Staff: $5/month per staff</div>
      </>
    ),
    btnClass: "sl-plan-btn sl-plan-btn-fill",
  },
  {
    id: "Enterprise",
    price: "459",
    txFee: "No Transaction Fee",
    txZero: true,
    extraLabel: "Everything Included:",
    features: [
      "All Professional Features",
      "Advanced Reports",
      "Full Analytics",
      "Multi-location Support",
      "Advanced Automation",
      "Priority Support",
      "Future Marketing Features",
    ],
    seats: (
      <>
        <strong>1 Owner</strong>
        <br />
        20+ Staff
        <div className="sl-add-staff" style={{ color: "#1a7a45" }}>
          No Additional Staff Fee
        </div>
      </>
    ),
    btnClass: "sl-plan-btn sl-plan-btn-dark",
  },
];

const WHY = [
  { icon: "📈", title: "Increase Bookings", desc: "Accept bookings 24/7 from any device" },
  { icon: "🔕", title: "Reduce No-Shows", desc: "Smart reminders keep customers coming" },
  { icon: "⏱️", title: "Save Time", desc: "Automate tasks and streamline your workflow" },
  { icon: "💰", title: "Boost Revenue", desc: "Better management leads to more sales" },
  { icon: "🛡️", title: "Trusted & Secure", desc: "Built with top security to protect your business" },
];

const STEPS = [
  {
    num: "01",
    title: "Choose Your Plan",
    desc: "Select the plan that fits your business size and needs. Start with a 15-day free trial — no credit card needed.",
  },
  {
    num: "02",
    title: "Set Up Your Shop",
    desc: "Enter your business name, address, services, staff, and working hours. Takes less than 10 minutes.",
  },
  {
    num: "03",
    title: "Share Your Booking Link",
    desc: "Get your unique booking URL instantly. Share it on your website, Google, Instagram, or anywhere customers find you.",
  },
  {
    num: "04",
    title: "Grow Your Business",
    desc: "Watch bookings come in automatically. Manage everything from one powerful dashboard — calendar, staff, sales, and more.",
  },
];

type LandingPageProps = {
  serifClassName?: string;
};

export default function LandingPage({ serifClassName = "" }: LandingPageProps) {
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupStep, setSetupStep] = useState<"form" | "payment">("form");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("Professional");
  const [selectedPrice, setSelectedPrice] = useState("349");
  const [submitting, setSubmitting] = useState(false);
  const [successUrl, setSuccessUrl] = useState("");
  const [dashboardUrl, setDashboardUrl] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [slug, setSlug] = useState("");

  function openSetup(plan: string, price: string) {
    setSelectedPlan(plan);
    setSelectedPrice(price);
    setSetupOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeSetup() {
    setSetupOpen(false);
    setSetupStep("form");
    setClientSecret(null);
    document.body.style.overflow = "";
  }

  function openSuccessModal(bookingUrl: string, loginUrl: string) {
    setSuccessUrl(bookingUrl);
    setDashboardUrl(loginUrl);
    closeSetup();
    setSuccessOpen(true);
    document.body.style.overflow = "hidden";
  }

  function closeSuccess() {
    setSuccessOpen(false);
    document.body.style.overflow = "";
    if (dashboardUrl) window.location.href = dashboardUrl;
  }

  function updateSlug(value: string) {
    const cleaned = value
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    setSlug(cleaned);
  }

  async function submitSetup() {
    if (!businessName.trim() || !ownerName.trim() || !phone.trim() || !email.trim() || !slug.trim()) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tenants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: businessName.trim(),
          ownerName: ownerName.trim(),
          ownerEmail: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          businessType: businessType.trim(),
          slug: slug.trim(),
          planLabel: selectedPlan,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        bookingUrl?: string;
        loginUrl?: string;
        dashboardUrl?: string;
        clientSecret?: string | null;
      };

      if (!res.ok) {
        alert(data.error ?? "Could not create account.");
        return;
      }

      const bookingUrl = data.bookingUrl ?? `https://www.sunshines88.com/book/${slug}`;
      const loginUrl = data.loginUrl ?? data.dashboardUrl ?? "/login";

      if (data.clientSecret) {
        setSuccessUrl(bookingUrl);
        setDashboardUrl(loginUrl);
        setClientSecret(data.clientSecret);
        setSetupStep("payment");
        return;
      }

      openSuccessModal(bookingUrl, loginUrl);
    } catch {
      alert("Unable to submit right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={`sl-root ${serifClassName}`}>
      <nav>
        <SunshineNavLogo serifClassName={serifClassName} />
        <div className="sl-nav-right">
          <div className="sl-nav-links">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#setup">Setup</a>
            <a href="#contact">Contact</a>
          </div>
          <div className="sl-nav-actions">
            <a href="/index.html" className="sl-nav-team">
              🌞 SS Team
            </a>
            <a href="/login" className="sl-nav-login">
              🔐 Log in
            </a>
            <a href="#pricing" className="sl-nav-cta">
              <span>Start Free</span>
              <span>Trial</span>
            </a>
          </div>
        </div>
      </nav>

      <section className="sl-hero">
        <div className="sl-hero-bg-circle" />
        <div className="sl-hero-bg-rays">☀</div>
        <div className="sl-hero-inner">
          <div>
            <div className="sl-hero-eyebrow">🌻 Sunshine Evolution Technology</div>
            <h1 className={serifClassName}>
              The All-in-One
              <br />
              <em>Online Booking System</em>
            </h1>
            <p className="sl-hero-sub">
              Increase bookings, reduce no-shows, manage your staff, and delight your customers —
              all in one powerful platform built for service businesses.
            </p>
            <div className="sl-hero-btns">
              <a href="#pricing" className="sl-btn-primary">
                Start 15-Day Free Trial →
              </a>
              <a href="#features" className="sl-btn-outline">
                See Features
              </a>
            </div>
            <div className="sl-hero-trust">
              <span className="sl-stars">★★★★★</span>
              <span>Trusted by thousands of businesses worldwide</span>
            </div>
          </div>
          <div className="sl-hero-visual">
            <div className="sl-badge-float">
              <span className="sl-bf-num">+42%</span>
              More Bookings
            </div>
            <div className="sl-mockup-phone">
              <div className="sl-mockup-bar">
                <div className="sl-mb-title">Book Now</div>
                <div className="sl-mb-date">May 2024 · Online Booking</div>
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginBottom: 8, letterSpacing: ".05em", textTransform: "uppercase" }}>
                Popular Services
              </div>
              {[
                ["🌿", "Thai Massage", "60 min · from $100", "rgba(245,166,35,.2)"],
                ["🕯️", "Aromatherapy", "60 min · from $110", "rgba(100,200,150,.15)"],
                ["💆", "Deep Tissue", "60 min · from $120", "rgba(200,100,150,.15)"],
              ].map(([icon, name, price, bg]) => (
                <div key={name} className="sl-mockup-service">
                  <div className="sl-ms-dot" style={{ background: bg as string }}>
                    {icon}
                  </div>
                  <div>
                    <div className="sl-ms-name">{name}</div>
                    <div className="sl-ms-price">{price}</div>
                  </div>
                </div>
              ))}
              <button type="button" className="sl-mockup-btn">
                Book Now
              </button>
            </div>
            <div className="sl-badge-float2">✓ Auto-Confirmed</div>
          </div>
        </div>
      </section>

      <div className="sl-features-strip" id="features">
        <div className="sl-features-strip-inner">
          {FEATURES.map((f) => (
            <div key={f.title} className="sl-feat-item sl-fade-up">
              <span className="sl-feat-icon">{f.icon}</span>
              <div className="sl-feat-title">{f.title}</div>
              <div className="sl-feat-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <section className="sl-section sl-pricing" id="pricing">
        <div className="sl-sec-inner">
          <div className="sl-pricing-header">
            <div className="sl-sec-eyebrow">Pricing</div>
            <h2 className={`sl-sec-title ${serifClassName}`}>
              Choose the Plan That Fits Your Business
            </h2>
            <p className="sl-sec-sub">
              No setup fee. No hidden charges. Cancel anytime. Start with a 15-day free trial.
            </p>
          </div>

          <div className="sl-pricing-grid">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`sl-plan-card sl-fade-up${plan.popular ? " popular" : ""}`}
              >
                {plan.popular ? <div className="sl-popular-badge">⭐ MOST POPULAR</div> : null}
                <div className="sl-plan-name">{plan.id}</div>
                <div className={`sl-plan-price ${serifClassName}`}>
                  ${plan.price}
                  <span> / month</span>
                </div>
                <div className={`sl-plan-txfee${plan.txZero ? " zero" : ""}`}>{plan.txFee}</div>
                {plan.extraLabel ? <div className="sl-plan-label">{plan.extraLabel}</div> : null}
                <ul className="sl-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}>
                      <span className="sl-ck">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="sl-plan-seats">{plan.seats}</div>
                <button
                  type="button"
                  className={plan.btnClass}
                  onClick={() => openSetup(plan.id, plan.price)}
                >
                  Start Free Trial
                </button>
              </div>
            ))}

            <div className="sl-side-col">
              <div className="sl-trial-box">
                <h3 className={serifClassName}>15-Day Free Trial</h3>
                <ul className="sl-trial-features">
                  <li>Full Access</li>
                  <li>All Features Included</li>
                  <li>No Credit Card Required</li>
                  <li>Cancel Anytime</li>
                </ul>
              </div>
              <div className="sl-perfect-box">
                <h3>Perfect For</h3>
                {[
                  ["💆", "Spas / Massage"],
                  ["💅", "Beauty Salons / Nail Salons"],
                  ["🏥", "Clinics / Med Spas"],
                  ["🏋️", "Fitness / Yoga Studios"],
                  ["🌿", "Wellness Centers"],
                ].map(([icon, label]) => (
                  <div key={label} className="sl-perfect-item">
                    <span>{icon}</span>
                    {label}
                  </div>
                ))}
                <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 8 }}>and more...</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="sl-section">
        <div className="sl-sec-inner" style={{ textAlign: "center" }}>
          <div className="sl-sec-eyebrow">Why Choose Us</div>
          <h2 className={`sl-sec-title ${serifClassName}`}>
            Why Business Owners Choose Sunshine Booking
          </h2>
          <div className="sl-why-grid">
            {WHY.map((w) => (
              <div key={w.title} className="sl-why-item sl-fade-up">
                <div className="sl-why-icon">{w.icon}</div>
                <div className="sl-why-title">{w.title}</div>
                <div className="sl-why-desc">{w.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sl-section sl-setup-section" id="setup">
        <div className="sl-sec-inner">
          <div className="sl-sec-eyebrow" style={{ color: "var(--sun)" }}>
            Getting Started
          </div>
          <h2 className={`sl-sec-title ${serifClassName}`}>Up and Running in Minutes</h2>
          <p className="sl-sec-sub">
            No technical knowledge required. We guide you through every step.
          </p>
          <div className="sl-steps-grid">
            {STEPS.map((s) => (
              <div key={s.num} className="sl-step-card">
                <span className={`sl-step-num ${serifClassName}`}>{s.num}</span>
                <div className="sl-step-title">{s.title}</div>
                <div className="sl-step-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sl-cta-section" id="contact">
        <div className="sl-sec-inner">
          <div className="sl-sec-eyebrow">Ready to Start?</div>
          <h2 className={`sl-sec-title ${serifClassName}`}>Ready to Grow Your Business?</h2>
          <p className="sl-sec-sub">
            Join thousands of businesses that trust Sunshine Booking. Start your free trial today.
          </p>
          <div className="sl-cta-btns">
            <button
              type="button"
              className="sl-btn-primary"
              onClick={() => openSetup("Professional", "349")}
            >
              Start Free Trial — No Credit Card
            </button>
            <a href="mailto:admin@sunshines88.com" className="sl-btn-outline">
              Contact Sales
            </a>
          </div>
          <div className="sl-cta-details">
            <span className="sl-cta-detail">No setup fee</span>
            <span className="sl-cta-detail">Cancel anytime</span>
            <span className="sl-cta-detail">Support that cares</span>
          </div>
          <div className="sl-qr-wrap">
            <div className="sl-qr-box">📱</div>
            <div className="sl-qr-text">
              <strong>www.sunshines88.com</strong>
              <span>Scan to visit or book a demo</span>
            </div>
          </div>
        </div>
      </section>

      <footer className="sl-footer">
        <div className="sl-legal-links">
          <LegalFooterLinks />
        </div>
        <div className="sl-footer-brand">
          🌞 <strong style={{ color: "#fff" }}>Sunshine Evolution Technology</strong> ·{" "}
          <Link href="https://www.sunshines88.com">www.sunshines88.com</Link> · © 2026 All Rights
          Reserved
        </div>
      </footer>

      {setupOpen ? (
        <div
          className="sl-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeSetup()}
          role="presentation"
        >
          <div className="sl-modal-sheet">
            <button type="button" className="sl-modal-close" onClick={closeSetup}>
              ✕
            </button>
            <div className="sl-modal-head">
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌞</div>
              <h2 className={serifClassName}>Start Your Free Trial</h2>
              <div style={{ fontSize: 14, color: "var(--gray)", marginTop: 4 }}>
                Plan: <strong style={{ color: "var(--sun)" }}>{selectedPlan}</strong> · $
                {selectedPrice}/month
              </div>
              <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>
                15-day free trial · Card required (not charged during trial)
              </div>
            </div>

            {setupStep === "payment" && clientSecret ? (
              <>
                <p style={{ fontSize: 14, color: "var(--gray)", marginBottom: 12, lineHeight: 1.5 }}>
                  Almost done! Add a payment method to start your free trial.
                </p>
                <PaymentForm
                  clientSecret={clientSecret}
                  onSuccess={() => openSuccessModal(successUrl, dashboardUrl)}
                  onError={(msg) => alert(msg)}
                />
                <button
                  type="button"
                  className="sl-submit-btn"
                  style={{ marginTop: 12, background: "transparent", color: "var(--gray)", border: "1px solid #eee" }}
                  onClick={() => openSuccessModal(successUrl, dashboardUrl)}
                >
                  Skip for now →
                </button>
              </>
            ) : null}

            {setupStep === "form" ? (
            <>
            <div className="sl-form-field">
              <label>Business Name *</label>
              <input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Sunshine Test"
              />
            </div>
            <div className="sl-form-field">
              <label>Your Name *</label>
              <input
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Owner's full name"
              />
            </div>
            <div className="sl-form-field">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(fmtPhoneInput(e.target.value))}
                placeholder="(xxx) xxx-xxxx"
              />
            </div>
            <div className="sl-form-field">
              <label>Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@yourbusiness.com"
              />
            </div>
            <div className="sl-form-field">
              <label>Business Address</label>
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Main St, City, State ZIP"
              />
            </div>
            <div className="sl-form-field">
              <label>Business Type</label>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
                <option value="">Select your business type…</option>
                <option>Spa / Massage</option>
                <option>Beauty Salon / Nail Salon</option>
                <option>Clinic / Med Spa</option>
                <option>Fitness / Yoga Studio</option>
                <option>Wellness Center</option>
                <option>Other</option>
              </select>
            </div>
            <div className="sl-form-field">
              <label>Create Username (Booking URL slug) *</label>
              <div className="sl-slug-wrap">
                <span className="sl-slug-prefix">sunshines88.com/book/</span>
                <input
                  value={slug}
                  onChange={(e) => updateSlug(e.target.value)}
                  placeholder="your-shop-name"
                />
              </div>
              <div className="sl-slug-preview">
                {slug ? (
                  <>
                    🔗 <strong>www.sunshines88.com/book/{slug}</strong>
                  </>
                ) : (
                  "Your booking URL will appear here"
                )}
              </div>
            </div>

            <button
              type="button"
              className="sl-submit-btn"
              disabled={submitting}
              onClick={submitSetup}
            >
              {submitting ? "Creating…" : "🌞 Create My Account & Start Free Trial"}
            </button>
            <div style={{ textAlign: "center", fontSize: 12, color: "var(--gray)", marginTop: 12 }}>
              By continuing you agree to our Terms of Service & Privacy Policy
            </div>
            </>
            ) : null}
          </div>
        </div>
      ) : null}

      {successOpen ? (
        <div
          className="sl-modal-overlay"
          style={{ zIndex: 1000 }}
          onClick={(e) => e.target === e.currentTarget && closeSuccess()}
          role="presentation"
        >
          <div className="sl-success-sheet">
            <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
            <h2 className={serifClassName} style={{ fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
              Welcome to Sunshine!
            </h2>
            <p style={{ fontSize: 15, color: "var(--gray)", marginBottom: 20, lineHeight: 1.6 }}>
              Your account has been created.
              <br />
              Check your email to verify and log in.
            </p>
            <div className="sl-success-url">{successUrl}</div>
            <button type="button" className="sl-btn-primary" onClick={closeSuccess}>
              Go to Dashboard →
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
