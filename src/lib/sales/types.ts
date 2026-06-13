export type SalesPeriod = "daily" | "weekly" | "monthly" | "yearly";

export type SalesBookingRow = {
  id: string;
  date: string;
  serviceName: string;
  servicePrice: number;
  addons: { name: string; price: number }[];
  addonTotal: number;
  tip: number;
  staff: string;
  payout: number;
};

export type SalesStaffPayoutRow = {
  id: string;
  name: string;
  role: string;
  base: number;
  comm: number;
  addonComm: number;
  tip: number;
  total: number;
};

export type SalesServiceRow = {
  name: string;
  sessions: number;
  revenue: number;
  color: string;
};

export type SalesAddonRow = {
  name: string;
  sessions: number;
  revenue: number;
  color: string;
};

export type SalesTimeSeries = {
  labels: string[];
  revenue: number[];
  payout: number[];
  profit: number[];
};

export type SalesAggregate = {
  svcRev: number;
  addonRev: number;
  tipRev: number;
  totalRev: number;
  totalPayout: number;
  netProfit: number;
  margin: number;
  services: SalesServiceRow[];
  addons: SalesAddonRow[];
  staffPayout: SalesStaffPayoutRow[];
  totalBase: number;
  totalComm: number;
  totalAddonC: number;
  totalTipC: number;
  timeSeries: SalesTimeSeries;
};

export type SalesFetchResult = {
  bookings: SalesBookingRow[];
  payroll: SalesStaffPayoutRow[];
};
