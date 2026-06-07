import type { UserRole } from "@/lib/auth/roles";

export type PayrollPeriod = "daily" | "weekly" | "monthly" | "yearly";
export type SalePeriod = "today" | "weekly" | "monthly" | "yearly";

export type QueueStatus = "active" | "cancel" | "noshow";

export type QueueItem = {
  id: string;
  time: string;
  durationMinutes: number;
  clientName: string;
  services: string[];
  staffName: string;
  requested: boolean;
  status: QueueStatus;
};

export type TodayTurn = {
  turn: number;
  time: string;
  hours: number;
  clientName: string;
  tips: number;
  commission: number;
  total: number;
};

export type PayrollDayRow = {
  day: string;
  hours: number;
  commission: number;
  tip: number;
  total: number;
};

export type StaffPayroll = {
  id: string;
  name: string;
  role: string;
  rows: PayrollDayRow[];
  totalHours: number;
  totalCommission: number;
  totalTip: number;
  total: number;
};

export type SaleBreakdown = {
  services: number;
  addons: number;
  tips: number;
  total: number;
};

export type SaleSummaryData = {
  clientCount: number;
  revenue: number;
  cash: SaleBreakdown;
  card: SaleBreakdown;
  grand: SaleBreakdown;
};

export type DashboardUser = {
  name: string;
  role: UserRole | string;
  employeeId?: string;
  employeeName?: string;
};

export type PriceCatalog = {
  services: Map<string, number>;
  addons: Map<string, number>;
};
