"use client";

import { useEffect } from "react";

/**
 * Client-side content protection for pages that show customer data.
 * Deters copying / screenshots:
 *  - disables selection (except editable fields), context menu, image drag
 *  - blocks copy/cut/save/print/view-source and DevTools shortcuts
 *  - clears the clipboard on PrintScreen
 *  - covers the page with a shield when the tab is hidden / loses focus
 *  - paints a traceable repeating watermark (label + timestamp)
 *
 * The web platform cannot truly block OS / mobile screenshots — the watermark
 * is the real traceability layer; everything else is a deterrent.
 */
export default function ContentGuard({ label }: { label?: string }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as unknown as { __sunshineGuard?: boolean }).__sunshineGuard) return;
    (window as unknown as { __sunshineGuard?: boolean }).__sunshineGuard = true;

    const text = label && label.trim() ? label.trim() : "Sunshine88 · Confidential";

    const esc = (s: string) =>
      s.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] || c));

    const stamp = () => {
      const d = new Date();
      const p = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
    };

    const wmUri = (l1: string, l2: string) => {
      const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200">' +
        '<g transform="rotate(-28 170 100)" fill="#6b6b6b" font-family="system-ui,Arial,sans-serif">' +
        `<text x="10" y="96" font-size="16" font-weight="600">${esc(l1)}</text>` +
        `<text x="10" y="120" font-size="12">${esc(l2)}</text>` +
        "</g></svg>";
      return `url("data:image/svg+xml;utf8,${encodeURIComponent(svg)}")`;
    };

    const style = document.createElement("style");
    style.setAttribute("data-sunshine-guard", "1");
    style.textContent = [
      "body{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-touch-callout:none}",
      "input,textarea,select,[contenteditable='true'],canvas{-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text;-webkit-touch-callout:default}",
      "img{-webkit-user-drag:none;user-drag:none}",
      ".sun-wm{position:fixed;inset:0;z-index:2147483646;pointer-events:none;opacity:.12;background-repeat:repeat}",
      ".sun-shield{position:fixed;inset:0;z-index:2147483647;display:none;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(24,14,8,.96);color:#fff;font-family:system-ui,Arial,sans-serif;text-align:center;padding:24px}",
      ".sun-shield b{font-size:18px;font-weight:700}.sun-shield span{font-size:13px;opacity:.82;max-width:320px}",
      "html.sun-hidden .sun-shield{display:flex}",
    ].join("");
    document.head.appendChild(style);

    const wm = document.createElement("div");
    wm.className = "sun-wm";
    wm.style.backgroundImage = wmUri(text, stamp());

    const shield = document.createElement("div");
    shield.className = "sun-shield";
    shield.innerHTML =
      "<b>Content hidden for security</b>" +
      "<span>เนื้อหาถูกซ่อนเพื่อความปลอดภัย · กลับมาที่หน้านี้เพื่อแสดงผลอีกครั้ง</span>";

    document.body.appendChild(wm);
    document.body.appendChild(shield);

    const wmTimer = window.setInterval(() => {
      wm.style.backgroundImage = wmUri(text, stamp());
    }, 60000);

    const root = document.documentElement;
    let flashTimer = 0;
    const hide = () => root.classList.add("sun-hidden");
    const show = () => root.classList.remove("sun-hidden");
    const flash = () => {
      hide();
      window.clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => {
        if (!document.hidden) show();
      }, 1200);
    };

    const onVis = () => (document.hidden ? hide() : show());

    // Window "blur" also fires when focus moves into an embedded (same-origin)
    // iframe — e.g. the dashboard calendar. Don't shield in that case.
    const onBlur = () => {
      window.setTimeout(() => {
        const ae = document.activeElement;
        if (ae && ae.tagName === "IFRAME") return;
        if (!document.hasFocus()) hide();
      }, 0);
    };

    const editable = (t: EventTarget | null) => {
      const el = t as HTMLElement | null;
      if (!el) return false;
      const tag = (el.tagName || "").toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable === true;
    };

    const clearClip = () => {
      try {
        navigator.clipboard?.writeText(" ").catch(() => {});
      } catch {}
    };

    const block = (e: Event) => {
      if ((e.type === "copy" || e.type === "cut") && editable(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    };

    const onKey = (e: KeyboardEvent) => {
      const k = (e.key || "").toLowerCase();
      if (e.key === "PrintScreen") { clearClip(); flash(); return; }
      if (e.key === "F12") { e.preventDefault(); return; }
      const ctrl = e.ctrlKey || e.metaKey;
      if (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) { e.preventDefault(); return; }
      if (ctrl && (k === "s" || k === "p" || k === "u")) { e.preventDefault(); return; }
      if (ctrl && (k === "c" || k === "x" || k === "a") && !editable(e.target)) { e.preventDefault(); return; }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") { clearClip(); flash(); }
    };

    const evts: Array<keyof DocumentEventMap> = ["contextmenu", "copy", "cut", "dragstart"];
    evts.forEach((ev) => document.addEventListener(ev, block, true));
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("keyup", onKeyUp, true);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", show);

    return () => {
      window.clearInterval(wmTimer);
      window.clearTimeout(flashTimer);
      evts.forEach((ev) => document.removeEventListener(ev, block, true));
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("keyup", onKeyUp, true);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", show);
      wm.remove();
      shield.remove();
      style.remove();
      root.classList.remove("sun-hidden");
      (window as unknown as { __sunshineGuard?: boolean }).__sunshineGuard = false;
    };
  }, [label]);

  return null;
}
