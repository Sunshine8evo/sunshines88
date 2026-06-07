"use client";

import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

export function useDashboardRealtime(shopId: string, onUpdate: () => void) {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard-${shopId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => onUpdate(),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [shopId, onUpdate]);
}
