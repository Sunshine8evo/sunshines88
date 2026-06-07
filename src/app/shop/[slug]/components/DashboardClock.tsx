"use client";

import { useEffect, useState } from "react";

import { formatClock } from "@/lib/dashboard/utils";

export default function DashboardClock() {
  const [clock, setClock] = useState(() => formatClock());

  useEffect(() => {
    const id = setInterval(() => setClock(formatClock()), 10_000);
    return () => clearInterval(id);
  }, []);

  return <div className="sd-welcome-datetime">{clock}</div>;
}
