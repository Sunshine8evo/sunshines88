export type BookingType = "solo" | "couple" | "group";

export type DurationOption = { v: string; add: number };

export type DisplayService = {
  id: string;
  icon: string;
  name: string;
  sub: string;
  basePrice: number;
  badge?: { text: string; variant: "pink" | "purple" };
  durations: DurationOption[];
};

export type DisplayStaff = {
  id: string;
  name: string;
  days: string;
  style?: string;
};

export type DisplayAddon = {
  name: string;
  price: number;
  icon: string;
  short: string;
};

export type ShopLocation = {
  id: string;
  name: string;
  addr: string;
};

export type ClientRecord = {
  fname: string;
  lname: string;
  phone: string;
  email: string;
  service: string;
  servicePrice: number;
  duration: string;
  durAdd: number;
  pressure: string;
  addons: string[];
  addonTotal: number;
  filled: boolean;
};

export const PRESSURE_OPTIONS = [
  { id: "CS Light", label: "CS Light", sub: "Calm" },
  { id: "CS Med", label: "CS Med", sub: "Balanced" },
  { id: "Med", label: "Med", sub: "Medium" },
  { id: "Heal", label: "Heal", sub: "Deep" },
] as const;

export const DEMO_SERVICES: DisplayService[] = [
  {
    id: "stretch",
    icon: "🌿",
    name: "Thai Stretch & Balance",
    sub: "60 / 90 / 120 min",
    basePrice: 75,
    badge: { text: "⭐ Popular Service of This Month", variant: "pink" },
    durations: [
      { v: "60", add: 0 },
      { v: "90", add: 20 },
      { v: "120", add: 40 },
    ],
  },
  {
    id: "combo",
    icon: "👑",
    name: "Thai Signature Combo",
    sub: "90 / 120 min",
    basePrice: 110,
    badge: { text: "✦ Best Seller", variant: "purple" },
    durations: [
      { v: "90", add: 0 },
      { v: "120", add: 30 },
    ],
  },
  {
    id: "deep",
    icon: "💆",
    name: "Deep Tissue Thai",
    sub: "60 / 90 / 120 min",
    basePrice: 80,
    durations: [
      { v: "60", add: 0 },
      { v: "90", add: 20 },
      { v: "120", add: 40 },
    ],
  },
];

export const DEMO_STAFF: DisplayStaff[] = [
  { id: "nok", name: "Nok", days: "Mon · Tue · Wed · Fri", style: "Stretch & Deep" },
  { id: "ploy", name: "Ploy", days: "Tue · Thu · Sat", style: "Calm & Gentle" },
  { id: "mint", name: "Mint", days: "Mon · Wed · Thu · Sun", style: "Traditional Thai" },
  { id: "joy", name: "Joy", days: "Wed · Fri · Sat · Sun", style: "Deep Tissue" },
];

export const DEMO_ADDONS: DisplayAddon[] = [
  { name: "Herbal Compress", price: 20, icon: "🌿", short: "Herbal" },
  { name: "Aromatherapy", price: 15, icon: "🕯️", short: "Aroma" },
  { name: "Foot Scrub", price: 15, icon: "🦶", short: "Foot Scrub" },
  { name: "Hot Stone", price: 25, icon: "🪨", short: "Hot Stone" },
];

export const DEMO_LOCATIONS: ShopLocation[] = [
  {
    id: "west",
    name: "Sunshine Test – Westheimer",
    addr: "1234 Westheimer Rd, Houston, TX 77006",
  },
  {
    id: "heights",
    name: "Sunshine Test – The Heights",
    addr: "5678 Heights Blvd, Houston, TX 77007",
  },
  {
    id: "memorial",
    name: "Sunshine Test – Memorial",
    addr: "910 Memorial Dr, Houston, TX 77024",
  },
];

export function mkClient(): ClientRecord {
  return {
    fname: "",
    lname: "",
    phone: "",
    email: "",
    service: "Thai Stretch & Balance",
    servicePrice: 75,
    duration: "",
    durAdd: 0,
    pressure: "",
    addons: [],
    addonTotal: 0,
    filled: false,
  };
}

export function fmtPhoneInput(value: string): string {
  const v = value.replace(/\D/g, "");
  if (v.length >= 6) {
    return `(${v.slice(0, 3)}) ${v.slice(3, 6)}-${v.slice(6, 10)}`;
  }
  if (v.length >= 3) {
    return `(${v.slice(0, 3)}) ${v.slice(3)}`;
  }
  return v;
}

export function buildTimeSlots(): string[] {
  const slots: string[] = [];
  for (let h = 10; h <= 19; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 19 && m > 0) break;
      const ampm = h < 12 ? "AM" : "PM";
      const hh = h > 12 ? h - 12 : h;
      slots.push(`${hh}:${m.toString().padStart(2, "0")} ${ampm}`);
    }
  }
  return slots;
}

export function buildCalendarDays(count = 14) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const label = `${days[d.getDay()]} ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    return { iso, label, dayNum: d.getDate(), weekday: days[d.getDay()] };
  });
}

export const STEP_LABELS = ["", "Services", "Date & Time", "Therapist", "Review", "Done"];
export const NEXT_LABELS = [
  "",
  "Select Date & Time →",
  "Choose Therapist →",
  "Review Booking →",
  "Confirm Booking",
  "",
];
