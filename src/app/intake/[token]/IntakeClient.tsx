"use client";

import { useEffect, useRef, useState } from "react";

export type IntakeBooking = {
  id: number | string;
  bookingDate: string;
  h: number;
  m: number;
  durationMinutes: number;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  service: string;
  addons: string;
  therapist: string;
  requestedTherapist: boolean;
  specialRequests: string;
};

export type PreviousIntake = {
  submittedAt: string | null;
  emergencyName: string;
  emergencyPhone: string;
  conditions: string[];
  otherCondition: string;
  isPregnant: boolean | null;
  pregnantWeeks: string;
  hadSurgery: boolean | null;
  surgeryType: string;
  surgeryDate: string;
  surgeryHowLong: string;
  surgeryArea: string;
  surgeryNotes: string;
  medications: string;
  allergies: string;
  discomfortAreas: string[];
  therapistNotes: string;
};

type Props = {
  booking: IntakeBooking;
  token: string;
  alreadySubmitted: boolean;
  previousIntake?: PreviousIntake | null;
  preview?: boolean;
};

const CONDITION_OPTIONS = [
  "Diabetes",
  "High blood pressure",
  "Heart disease / pacemaker",
  "Blood clotting disorder",
  "Autoimmune condition",
  "Epilepsy / seizures",
  "Osteoporosis",
  "Cancer / chemotherapy",
  "Skin condition (eczema, psoriasis)",
  "None of the above",
];

const DISCOMFORT_OPTIONS = [
  "Neck / shoulders",
  "Upper back",
  "Lower back",
  "Arms / hands",
  "Hips / legs",
  "Head / temples",
];

function fmtDate(d: string): string {
  if (!d) return "—";
  const date = new Date(`${d}T12:00:00`);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function fmtTime(h: number, m: number): string {
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

function parseAddons(raw: string): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,+|;]/)
    .map((s) => s.trim().replace(/^\+/, ""))
    .filter(Boolean);
}

function toggleItem(list: string[], val: string): string[] {
  return list.includes(val) ? list.filter((x) => x !== val) : [...list, val];
}

/* ── Inline icons (Tabler-style, no external font dependency) ── */
function Icon({ name }: { name: string }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "check":
      return (
        <svg {...common}>
          <path d="M5 12l5 5L20 7" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M4 11h16" />
        </svg>
      );
    case "service":
      return (
        <svg {...common}>
          <path d="M4 13c0-4 3.5-7 8-7s8 3 8 7" />
          <path d="M4 13a3 3 0 0 0 6 0M14 13a3 3 0 0 0 6 0M12 6V4" />
        </svg>
      );
    case "user":
      return (
        <svg {...common}>
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3z" />
          <path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8z" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.5-7-9.5A3.5 3.5 0 0 1 12 7a3.5 3.5 0 0 1 7 3.5C19 15.5 12 20 12 20z" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "alert":
      return (
        <svg {...common}>
          <path d="M12 4l9 16H3z" />
          <path d="M12 10v4M12 17.5v.5" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common} width={13} height={13}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    default:
      return null;
  }
}

/* ── Signature pad (native canvas, dependency-free) ── */
function SignaturePad({ onChange }: { onChange: (dataUrl: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#412402";
  }, []);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx || !last.current) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };

  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    const canvas = canvasRef.current;
    if (canvas && hasInk) onChange(canvas.toDataURL("image/png"));
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setHasInk(false);
    onChange("");
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        className="sig-canvas"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerLeave={end}
      />
      <div className="sig-actions">
        {!hasInk && <span className="sig-hint">Sign above with your mouse or finger</span>}
        <button type="button" className="sig-clear" onClick={clear}>
          Clear
        </button>
      </div>
    </div>
  );
}

function fmtPrevDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function IntakeClient({
  booking,
  token,
  alreadySubmitted,
  previousIntake = null,
  preview = false,
}: Props) {
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");

  const [conditions, setConditions] = useState<string[]>([]);
  const [otherCondition, setOtherCondition] = useState("");
  const [isPregnant, setIsPregnant] = useState<boolean | null>(null);
  const [pregnantWeeks, setPregnantWeeks] = useState("");
  const [hadSurgery, setHadSurgery] = useState<boolean | null>(null);
  const [surgeryType, setSurgeryType] = useState("");
  const [surgeryDate, setSurgeryDate] = useState("");
  const [surgeryHowLong, setSurgeryHowLong] = useState("");
  const [surgeryArea, setSurgeryArea] = useState("");
  const [surgeryNotes, setSurgeryNotes] = useState("");
  const [medications, setMedications] = useState("");
  const [allergies, setAllergies] = useState("");
  const [discomfortAreas, setDiscomfortAreas] = useState<string[]>([]);
  const [therapistNotes, setTherapistNotes] = useState("");

  const [consentAgreed, setConsentAgreed] = useState(false);
  const [policyAgreed, setPolicyAgreed] = useState(false);
  const [signatureData, setSignatureData] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(alreadySubmitted);
  const [error, setError] = useState("");

  // Returning-customer flow.
  const [showReturning, setShowReturning] = useState(Boolean(previousIntake));
  const [locked, setLocked] = useState(false);

  function applyPrevious(lock: boolean) {
    if (!previousIntake) return;
    setEmergencyName(previousIntake.emergencyName);
    setEmergencyPhone(previousIntake.emergencyPhone);
    setConditions(previousIntake.conditions);
    setOtherCondition(previousIntake.otherCondition);
    setIsPregnant(previousIntake.isPregnant);
    setPregnantWeeks(previousIntake.pregnantWeeks);
    setHadSurgery(previousIntake.hadSurgery);
    setSurgeryType(previousIntake.surgeryType);
    setSurgeryDate(previousIntake.surgeryDate);
    setSurgeryHowLong(previousIntake.surgeryHowLong);
    setSurgeryArea(previousIntake.surgeryArea);
    setSurgeryNotes(previousIntake.surgeryNotes);
    setMedications(previousIntake.medications);
    setAllergies(previousIntake.allergies);
    setDiscomfortAreas(previousIntake.discomfortAreas);
    setTherapistNotes(previousIntake.therapistNotes);
    setLocked(lock);
    setShowReturning(false);
    setError("");
  }

  const firstName = booking.firstName || booking.name || "";
  const lastName = booking.lastName || "";
  const addonList = parseAddons(booking.addons);
  const therapistDisplay = booking.therapist || "Anyone";
  const hasExtras = addonList.length > 0 || Boolean(booking.specialRequests);

  async function handleSubmit() {
    if (preview) {
      // Sample mode for SS System — show the confirmation state without saving.
      setError("");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setError("Please add an emergency contact name and phone.");
      return;
    }
    if (isPregnant === null || hadSurgery === null) {
      setError("Please answer the pregnancy and surgery questions.");
      return;
    }
    if (!consentAgreed) {
      setError("Please confirm the consent checkbox to continue.");
      return;
    }
    if (!signatureData) {
      setError("Please add your signature before submitting.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/intake/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          emergency_name: emergencyName,
          emergency_phone: emergencyPhone,
          conditions,
          other_condition: otherCondition,
          is_pregnant: isPregnant,
          pregnant_weeks: isPregnant ? pregnantWeeks : null,
          had_surgery: hadSurgery,
          surgery_type: surgeryType,
          surgery_date: surgeryDate,
          surgery_how_long: surgeryHowLong,
          surgery_area: surgeryArea,
          surgery_notes: surgeryNotes,
          medications,
          allergies,
          discomfort_areas: discomfortAreas,
          therapist_notes: therapistNotes,
          consent_agreed: consentAgreed,
          policy_agreed: policyAgreed,
          signature_data: signatureData,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(json.error || "Something went wrong. Please try again.");
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="intake-page">
        <div className="wrap">
          {preview && (
            <div className="preview-banner">
              <Icon name="lock" />
              <span>
                <strong>Preview mode</strong> — sample confirmation screen. Nothing is
                saved.
              </span>
            </div>
          )}
          <div className="success-screen">
            <div className="success-icon">
              <Icon name="check" />
            </div>
            <h2>Thank you!</h2>
            <p>
              Your intake form has been submitted. We look forward to seeing you on{" "}
              <strong>{fmtDate(booking.bookingDate)}</strong>.
            </p>
            <p className="success-note">
              Please arrive 5 minutes early for your consultation.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const weeksNum = parseInt(pregnantWeeks, 10);

  return (
    <div className="intake-page">
      <div className="wrap">
        {preview && (
          <div className="preview-banner">
            <Icon name="lock" />
            <span>
              <strong>Preview mode</strong> — this is a sample of the customer intake
              form. Nothing is saved.
            </span>
          </div>
        )}

        {/* HERO */}
        <div className="hero">
          <div className="hero-icon">
            <Icon name="check" />
          </div>
          <div>
            <div className="hero-title">Booking confirmed!</div>
            <div className="hero-sub">
              Please complete this form to finalize your appointment.
            </div>
          </div>
        </div>

        {/* RETURNING CUSTOMER */}
        {showReturning && previousIntake && (
          <div className="returning-box">
            <div className="returning-head">
              <Icon name="user" />
              <div>
                <div className="returning-title">Welcome back!</div>
                <div className="returning-sub">
                  We found your previous information
                  {previousIntake.submittedAt
                    ? ` (last completed ${fmtPrevDate(previousIntake.submittedAt)})`
                    : ""}
                  . Use it again or start fresh?
                </div>
              </div>
            </div>
            <div className="returning-actions">
              <button
                type="button"
                className="ret-btn ret-primary"
                onClick={() => applyPrevious(true)}
              >
                Use existing
              </button>
              <button
                type="button"
                className="ret-btn"
                onClick={() => applyPrevious(false)}
              >
                Edit previous
              </button>
              <button
                type="button"
                className="ret-btn ret-ghost"
                onClick={() => setShowReturning(false)}
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

        {locked && (
          <div className="locked-bar">
            <span>
              <Icon name="lock" />
              Using your previous information — please review, then sign below
            </span>
            <button type="button" className="locked-edit" onClick={() => setLocked(false)}>
              Edit
            </button>
          </div>
        )}

        {/* APPOINTMENT SUMMARY */}
        <div className="card">
          <div className="card-label">
            <Icon name="calendar" />
            Appointment summary
          </div>

          <div className="appt-row">
            <div className="appt-icon">
              <Icon name="calendar" />
            </div>
            <div>
              <div className="appt-key">Date &amp; time</div>
              <div className="appt-val">
                {fmtDate(booking.bookingDate)} · {fmtTime(booking.h, booking.m)}
              </div>
            </div>
          </div>

          <div className="appt-row">
            <div className="appt-icon">
              <Icon name="service" />
            </div>
            <div>
              <div className="appt-key">Service</div>
              <div className="appt-val">
                {booking.service || "—"} · {booking.durationMinutes} min
              </div>
            </div>
          </div>

          <div className="appt-row">
            <div className="appt-icon">
              <Icon name="user" />
            </div>
            <div>
              <div className="appt-key">Therapist</div>
              <div className="appt-val">{therapistDisplay}</div>
            </div>
          </div>

          {hasExtras && (
            <div className="appt-row">
              <div className="appt-icon">
                <Icon name="sparkles" />
              </div>
              <div>
                <div className="appt-key">Add-ons &amp; requests</div>
                <div className="appt-pills">
                  {addonList.map((a) => (
                    <span key={a} className="addon-pill">
                      {a}
                    </span>
                  ))}
                  {booking.specialRequests && (
                    <span className="addon-pill">{booking.specialRequests}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* PERSONAL INFO */}
        <div className="card">
          <div className="card-label">
            <Icon name="user" />
            Personal information
          </div>
          <div className="row2">
            <div className="field">
              <label>First name</label>
              <input type="text" value={firstName} readOnly />
            </div>
            <div className="field">
              <label>Last name</label>
              <input type="text" value={lastName} readOnly />
            </div>
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="text" value={booking.phone} readOnly />
            <div className="prefill-note">
              <Icon name="lock" />
              Pre-filled from your booking
            </div>
          </div>

          <div className="divider" />
          <div className="card-label sub">
            <Icon name="heart" />
            Emergency contact
          </div>
          <div className="row2">
            <div className="field">
              <label>
                Name <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="Full name"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                readOnly={locked}
              />
            </div>
            <div className="field">
              <label>
                Phone <span className="req">*</span>
              </label>
              <input
                type="tel"
                placeholder="(555) 000-0000"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                readOnly={locked}
              />
            </div>
          </div>
        </div>

        {/* HEALTH & MEDICAL */}
        <div className="card">
          <div className="card-label">
            <Icon name="heart" />
            Health &amp; medical history
          </div>

          <div className="section-q">
            Underlying conditions — please check all that apply:
          </div>
          <div className="cond-grid">
            {CONDITION_OPTIONS.map((c) => (
              <label key={c} className="chk">
                <input
                  type="checkbox"
                  checked={conditions.includes(c)}
                  onChange={() => setConditions((prev) => toggleItem(prev, c))}
                  disabled={locked}
                />{" "}
                {c}
              </label>
            ))}
          </div>
          <div className="field spaced">
            <label>Other conditions not listed above</label>
            <input
              type="text"
              placeholder="Please specify..."
              value={otherCondition}
              onChange={(e) => setOtherCondition(e.target.value)}
              readOnly={locked}
            />
          </div>

          <div className="divider" />

          <div className="section-q">
            Are you currently pregnant? <span className="req">*</span>
          </div>
          <div className="radio-row">
            <label className="radio-item">
              <input
                type="radio"
                name="pregnant"
                checked={isPregnant === false}
                onChange={() => setIsPregnant(false)}
                disabled={locked}
              />{" "}
              No
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="pregnant"
                checked={isPregnant === true}
                onChange={() => setIsPregnant(true)}
                disabled={locked}
              />{" "}
              Yes
            </label>
          </div>
          {isPregnant && (
            <div className="weeks-inline">
              <input
                type="number"
                placeholder="0"
                min={1}
                max={42}
                value={pregnantWeeks}
                onChange={(e) => setPregnantWeeks(e.target.value)}
                readOnly={locked}
              />
              <span>weeks pregnant</span>
              {weeksNum > 0 && weeksNum < 12 && (
                <div className="warn-box full">
                  <Icon name="alert" />
                  Prenatal massage is not recommended before 12 weeks. Please consult
                  your physician.
                </div>
              )}
            </div>
          )}

          <div className="divider" />

          <div className="section-q">
            Have you had surgery before? <span className="req">*</span>
          </div>
          <div className="radio-row">
            <label className="radio-item">
              <input
                type="radio"
                name="surgery"
                checked={hadSurgery === false}
                onChange={() => setHadSurgery(false)}
                disabled={locked}
              />{" "}
              No
            </label>
            <label className="radio-item">
              <input
                type="radio"
                name="surgery"
                checked={hadSurgery === true}
                onChange={() => setHadSurgery(true)}
                disabled={locked}
              />{" "}
              Yes
            </label>
          </div>
          {hadSurgery && (
            <div className="sub-card">
              <div className="field">
                <label>
                  Type of surgery / procedure <span className="req">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. knee replacement, c-section..."
                  value={surgeryType}
                  onChange={(e) => setSurgeryType(e.target.value)}
                  readOnly={locked}
                />
              </div>
              <div className="row2">
                <div className="field">
                  <label>Approximate date</label>
                  <input
                    type="month"
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    readOnly={locked}
                  />
                </div>
                <div className="field">
                  <label>How long ago?</label>
                  <select
                    value={surgeryHowLong}
                    onChange={(e) => setSurgeryHowLong(e.target.value)}
                    disabled={locked}
                  >
                    <option value="">Select</option>
                    <option>Less than 3 months</option>
                    <option>3–6 months</option>
                    <option>6–12 months</option>
                    <option>1–2 years ago</option>
                    <option>More than 2 years ago</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Area of body involved</label>
                <input
                  type="text"
                  placeholder="e.g. right knee, abdomen..."
                  value={surgeryArea}
                  onChange={(e) => setSurgeryArea(e.target.value)}
                  readOnly={locked}
                />
              </div>
              <div className="field">
                <label>Any ongoing symptoms or limitations?</label>
                <input
                  type="text"
                  placeholder="e.g. still healing, limited range of motion..."
                  value={surgeryNotes}
                  onChange={(e) => setSurgeryNotes(e.target.value)}
                  readOnly={locked}
                />
              </div>
              <div className="warn-box">
                <Icon name="alert" />
                Recent surgery (within 3 months) may require physician clearance.
              </div>
            </div>
          )}

          <div className="divider" />

          <div className="field">
            <label>
              Current medications <span className="optional">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. blood thinners, supplements..."
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              readOnly={locked}
            />
          </div>
          <div className="field">
            <label>
              Known allergies <span className="optional">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. latex, essential oils..."
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              readOnly={locked}
            />
          </div>

          <div className="divider" />

          <div className="section-q">Areas of discomfort today?</div>
          <div className="symptom-grid">
            {DISCOMFORT_OPTIONS.map((a) => (
              <label key={a} className="chk">
                <input
                  type="checkbox"
                  checked={discomfortAreas.includes(a)}
                  onChange={() => setDiscomfortAreas((prev) => toggleItem(prev, a))}
                  disabled={locked}
                />{" "}
                {a}
              </label>
            ))}
          </div>
          <div className="field spaced">
            <label>Additional notes for therapist</label>
            <input
              type="text"
              placeholder="Anything else we should know..."
              value={therapistNotes}
              onChange={(e) => setTherapistNotes(e.target.value)}
              readOnly={locked}
            />
          </div>
        </div>

        {/* CONSENT */}
        <div className="card">
          <div className="card-label">
            <Icon name="shield" />
            Client agreement &amp; consent
          </div>
          <div className="policy-box">
            <p>
              Client information is confidential and will not be disclosed without
              written consent.
            </p>
            <p>
              Please reschedule if you are more than 15 minutes late. A 24-hour
              cancellation notice is required.
            </p>
            <p>
              You will have a consultation with your therapist before the session and
              may end the session at any time.
            </p>
            <p>
              Therapeutic massage does not diagnose or treat illness. It is not a
              substitute for medical examination.
            </p>
            <p>
              If you experience pain or discomfort during the session, please inform
              your therapist immediately.
            </p>
            <p>
              Inappropriate behavior will not be tolerated and may be prosecuted to
              the full extent of the law.
            </p>
          </div>
          <label className="agree-row">
            <input
              type="checkbox"
              checked={consentAgreed}
              onChange={(e) => setConsentAgreed(e.target.checked)}
            />
            <span>
              I confirm that all information provided is true and accurate. I
              understand that if any information given is false or withheld and causes
              harm or error, <strong>Sunshine Spa</strong> will not be held
              responsible.
              <span className="req">*</span>
            </span>
          </label>
          <label className="agree-row">
            <input
              type="checkbox"
              checked={policyAgreed}
              onChange={(e) => setPolicyAgreed(e.target.checked)}
            />
            <span>I agree to the cancellation policy and client agreement above.</span>
          </label>
          <div className="field signature-field">
            <label>
              Signature <span className="req">*</span>
            </label>
            <SignaturePad onChange={setSignatureData} />
          </div>
        </div>

        {error && <div className="error-box">{error}</div>}

        <button className="submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting
            ? "Submitting…"
            : preview
              ? "Preview confirmation screen"
              : "Submit & confirm booking"}
        </button>
      </div>
    </div>
  );
}
