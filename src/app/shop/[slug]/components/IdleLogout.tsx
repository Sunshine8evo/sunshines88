"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

const ACTIVITY_KEY = "sunshine-last-activity";
const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "wheel",
  "touchstart",
  "scroll",
  "click",
] as const;

type IdleLogoutProps = {
  /** Minutes of inactivity before the user is signed out. */
  timeoutMinutes?: number;
};

/**
 * Signs the user out after a period of inactivity.
 *
 * Activity is tracked via a shared localStorage timestamp so it survives page
 * reloads, syncs across tabs, and — because the legacy embeds run on the same
 * origin — counts interaction happening inside the calendar/queue/settings
 * iframes too (those pages write to the same key).
 */
export default function IdleLogout({ timeoutMinutes = 30 }: IdleLogoutProps) {
  useEffect(() => {
    const timeoutMs = timeoutMinutes * 60_000;
    const WRITE_THROTTLE_MS = 10_000;
    const CHECK_INTERVAL_MS = 20_000;

    let lastWrite = 0;
    let loggingOut = false;

    const markActivity = () => {
      const now = Date.now();
      if (now - lastWrite < WRITE_THROTTLE_MS) return;
      lastWrite = now;
      try {
        localStorage.setItem(ACTIVITY_KEY, String(now));
      } catch {
        /* storage unavailable */
      }
    };

    const lastActivity = (): number => {
      try {
        const raw = localStorage.getItem(ACTIVITY_KEY);
        const value = raw ? Number(raw) : NaN;
        return Number.isFinite(value) ? value : Date.now();
      } catch {
        return Date.now();
      }
    };

    const logout = async () => {
      if (loggingOut) return;
      loggingOut = true;
      try {
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        /* sign out best effort */
      }
      try {
        localStorage.removeItem(ACTIVITY_KEY);
      } catch {
        /* ignore */
      }
      window.location.assign("/login?timeout=1");
    };

    const check = () => {
      if (Date.now() - lastActivity() >= timeoutMs) {
        void logout();
      }
    };

    // Loading the page counts as activity.
    lastWrite = 0;
    markActivity();

    ACTIVITY_EVENTS.forEach((ev) =>
      window.addEventListener(ev, markActivity, { passive: true }),
    );
    const onVisible = () => {
      if (document.visibilityState === "visible") {
        check();
        markActivity();
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    const interval = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      window.clearInterval(interval);
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, markActivity));
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [timeoutMinutes]);

  return null;
}
