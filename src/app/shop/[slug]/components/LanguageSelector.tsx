"use client";

import { useEffect, useRef, useState } from "react";

import {
  LANG_OPTIONS,
  langButtonLabel,
  postLangToCalendarIframe,
  readStoredLang,
  storeLang,
  type DashboardLang,
} from "@/lib/dashboard/languages";

export default function LanguageSelector() {
  const [lang, setLang] = useState<DashboardLang>("en");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLang(readStoredLang());
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  function selectLanguage(next: DashboardLang) {
    setLang(next);
    storeLang(next);
    postLangToCalendarIframe(next);
    setOpen(false);
  }

  return (
    <div className="sd-lang-wrap" ref={rootRef}>
      <button
        type="button"
        className="sd-lang-btn"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="sd-lang-icon" aria-hidden>
          🌐
        </span>
        <span>{langButtonLabel(lang)}</span>
        <span className="sd-lang-chevron" aria-hidden>
          ▾
        </span>
      </button>

      {open ? (
        <div className="sd-lang-popup" role="listbox" aria-label="Select language">
          <p className="sd-lang-popup-title">Select Language</p>
          <div className="sd-lang-grid">
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.k}
                type="button"
                role="option"
                aria-selected={lang === opt.k}
                className={`sd-lang-option${lang === opt.k ? " on" : ""}`}
                onClick={() => selectLanguage(opt.k)}
              >
                <span className="sd-lang-flag">{opt.f}</span>
                {opt.n}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
