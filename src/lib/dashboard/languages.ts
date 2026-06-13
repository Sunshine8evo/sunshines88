export type DashboardLang = "en" | "th" | "zh" | "es" | "ja" | "ko";

export const DASHBOARD_LANG_KEY = "sunshine_lang";

export const LANG_OPTIONS: {
  k: DashboardLang;
  f: string;
  n: string;
}[] = [
  { k: "en", f: "🇺🇸", n: "English" },
  { k: "th", f: "🇹🇭", n: "ภาษาไทย" },
  { k: "zh", f: "🇨🇳", n: "中文" },
  { k: "es", f: "🇪🇸", n: "Español" },
  { k: "ja", f: "🇯🇵", n: "日本語" },
  { k: "ko", f: "🇰🇷", n: "한국어" },
];

export function readStoredLang(): DashboardLang {
  if (typeof window === "undefined") return "en";
  try {
    const saved = localStorage.getItem(DASHBOARD_LANG_KEY);
    if (saved && LANG_OPTIONS.some((o) => o.k === saved)) {
      return saved as DashboardLang;
    }
  } catch {
    /* ignore */
  }
  return "en";
}

export function storeLang(lang: DashboardLang): void {
  try {
    localStorage.setItem(DASHBOARD_LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}

export function langButtonLabel(lang: DashboardLang): string {
  const opt = LANG_OPTIONS.find((o) => o.k === lang) ?? LANG_OPTIONS[0];
  return `${opt.f} ${lang.toUpperCase()}`;
}

export function postLangToCalendarIframe(lang: DashboardLang): void {
  const iframe = document.querySelector(
    ".sd-calendar-frame",
  ) as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage({ type: "sunshine-set-lang", lang }, "*");
}

export type DashboardTheme = "light" | "dark";

export function postThemeToCalendarIframe(theme: DashboardTheme): void {
  const iframe = document.querySelector(
    ".sd-calendar-frame",
  ) as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage({ type: "sunshine-set-theme", theme }, "*");
}
