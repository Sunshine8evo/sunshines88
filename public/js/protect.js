/*
 * Sunshine88 content protection (legacy HTML pages).
 * Deters copying / screenshots of customer data:
 *  - disables text selection (except in editable fields), context menu, drag
 *  - blocks copy/cut/save/print/view-source and DevTools shortcuts
 *  - tries to clear the clipboard on PrintScreen
 *  - covers the page with a shield when the tab is hidden (anti-screen-record)
 *  - paints a traceable, repeating watermark (user + timestamp)
 *
 * NOTE: the web platform cannot truly block OS / mobile screenshots. The
 * watermark is the real traceability layer; everything else is a deterrent.
 */
(function () {
  if (window.__sunshineProtect) return;
  window.__sunshineProtect = true;

  var embedded = false;
  try {
    embedded = document.documentElement.classList.contains("embed-mode");
  } catch (e) {}

  function esc(s) {
    return String(s == null ? "" : s).replace(/[<>&"]/g, function (c) {
      return { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c];
    });
  }

  function whoLabel() {
    if (typeof window.__PROTECT_LABEL__ === "string" && window.__PROTECT_LABEL__) {
      return window.__PROTECT_LABEL__;
    }
    try {
      var raw = sessionStorage.getItem("sunshine_user");
      if (raw) {
        var u = JSON.parse(raw);
        var who = u.name || u.username || u.phone || u.email || u.role || "";
        if (who) return "Sunshine88 · " + who;
      }
    } catch (e) {}
    return "Sunshine88 · Confidential";
  }

  function stamp() {
    var d = new Date();
    function p(n) { return String(n).padStart(2, "0"); }
    return (
      d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
      " " + p(d.getHours()) + ":" + p(d.getMinutes())
    );
  }

  function wmUri(line1, line2) {
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="340" height="200">' +
      '<g transform="rotate(-28 170 100)" fill="#6b6b6b" font-family="system-ui,Arial,sans-serif">' +
      '<text x="10" y="96" font-size="16" font-weight="600">' + esc(line1) + "</text>" +
      '<text x="10" y="120" font-size="12">' + esc(line2) + "</text>" +
      "</g></svg>";
    return 'url("data:image/svg+xml;utf8,' + encodeURIComponent(svg) + '")';
  }

  /* ---- styles ---- */
  var style = document.createElement("style");
  style.textContent = [
    "body{-webkit-user-select:none;-moz-user-select:none;-ms-user-select:none;user-select:none;-webkit-touch-callout:none}",
    "input,textarea,select,[contenteditable='true'],canvas,.sig-canvas{-webkit-user-select:text;-moz-user-select:text;-ms-user-select:text;user-select:text;-webkit-touch-callout:default}",
    "img{-webkit-user-drag:none;user-drag:none}",
    ".sun-wm{position:fixed;inset:0;z-index:2147483646;pointer-events:none;opacity:.12;background-repeat:repeat;background-position:0 0}",
    ".sun-shield{position:fixed;inset:0;z-index:2147483647;display:none;flex-direction:column;align-items:center;justify-content:center;gap:8px;background:rgba(24,14,8,.96);color:#fff;font-family:system-ui,Arial,sans-serif;text-align:center;padding:24px}",
    ".sun-shield b{font-size:18px;font-weight:700}.sun-shield span{font-size:13px;opacity:.82;max-width:320px}",
    "html.sun-hidden .sun-shield{display:flex}",
  ].join("");

  function mount() {
    if (style.parentNode == null) (document.head || document.documentElement).appendChild(style);

    var wm = document.createElement("div");
    wm.className = "sun-wm";
    wm.style.backgroundImage = wmUri(whoLabel(), stamp());

    var shield = document.createElement("div");
    shield.className = "sun-shield";
    shield.innerHTML =
      "<b>Content hidden for security</b>" +
      "<span>เนื้อหาถูกซ่อนเพื่อความปลอดภัย · กลับมาที่หน้านี้เพื่อแสดงผลอีกครั้ง</span>";

    document.body.appendChild(wm);
    document.body.appendChild(shield);

    // refresh watermark timestamp periodically
    setInterval(function () {
      wm.style.backgroundImage = wmUri(whoLabel(), stamp());
    }, 60000);
  }

  /* ---- shield (hide on tab hidden / focus loss) ---- */
  var flashTimer = null;
  function hide() { document.documentElement.classList.add("sun-hidden"); }
  function show() { document.documentElement.classList.remove("sun-hidden"); }
  function flash() {
    hide();
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () {
      if (!document.hidden) show();
    }, 1200);
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) hide(); else show();
  });
  // Avoid focus thrash when embedded in the dashboard iframe; the parent
  // (ContentGuard) handles window-blur shielding for the whole app.
  if (!embedded) {
    window.addEventListener("blur", hide);
    window.addEventListener("focus", show);
  }

  /* ---- copy / context / drag blocking ---- */
  function editable(t) {
    if (!t) return false;
    var tag = (t.tagName || "").toLowerCase();
    return tag === "input" || tag === "textarea" || t.isContentEditable === true;
  }
  ["contextmenu", "copy", "cut", "dragstart"].forEach(function (ev) {
    document.addEventListener(ev, function (e) {
      if ((ev === "copy" || ev === "cut") && editable(e.target)) return;
      e.preventDefault();
      e.stopPropagation();
    }, true);
  });

  /* ---- clipboard clear on PrintScreen ---- */
  function clearClip() {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(" ").catch(function () {});
      }
    } catch (e) {}
  }

  /* ---- keyboard shortcuts ---- */
  function onKey(e) {
    var k = (e.key || "").toLowerCase();
    if (e.key === "PrintScreen") { clearClip(); flash(); return; }
    if (e.key === "F12") { e.preventDefault(); return; }
    var ctrl = e.ctrlKey || e.metaKey;
    if (ctrl && e.shiftKey && (k === "i" || k === "j" || k === "c")) { e.preventDefault(); return; }
    if (ctrl && (k === "s" || k === "p" || k === "u")) { e.preventDefault(); return; }
    if (ctrl && (k === "c" || k === "x" || k === "a") && !editable(e.target)) { e.preventDefault(); return; }
  }
  document.addEventListener("keydown", onKey, true);
  document.addEventListener("keyup", function (e) {
    if (e.key === "PrintScreen") { clearClip(); flash(); }
  }, true);

  if (document.body) mount();
  else document.addEventListener("DOMContentLoaded", mount);
})();
