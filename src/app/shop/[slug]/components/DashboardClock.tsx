"use client";

import { useEffect, useState } from "react";

import { formatClock } from "@/lib/dashboard/utils";

export default function DashboardClock() {
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => setClock(formatClock());
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, []);

  return <div className="sd-welcome-datetime">{clock}</div>;
}
