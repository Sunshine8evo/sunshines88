import type { Addon, Service, Staff } from "./types";

export const FALLBACK_SERVICES: Service[] = [
  { name: "Thai Massage 60 min", price: 65, duration: 60, type: "single" },
  { name: "Oil Massage 90 min", price: 95, duration: 90, type: "single" },
  { name: "Spa Body Treatment", price: 120, duration: 90, type: "single" },
  { name: "Facial", price: 85, duration: 60, type: "single" },
  { name: "Couple Massage 90 min", price: 160, duration: 90, type: "couple" },
  { name: "Haircut", price: 35, duration: 45, type: "single" },
];

export const FALLBACK_STAFF: Staff[] = [
  { name: "Pam", full_name: "Pamrin Suksong", status: "on" },
  { name: "Noon", full_name: "Nuchnat Meesuk", status: "on" },
  { name: "Min", full_name: "Minta Dee-ngam", status: "on" },
  { name: "Jane", full_name: "Jennifer Thongdee", status: "on" },
];

export const FALLBACK_ADDONS: Addon[] = [
  { name: "Aromatherapy", price: 12 },
  { name: "Hot Stones", price: 25 },
  { name: "Thai Herbs", price: 18 },
  { name: "Body Scrub", price: 28 },
  { name: "Vitamin C Mask", price: 15 },
  { name: "Eye Treatment", price: 10 },
];

export const OPEN_HOUR = 10;
export const CLOSE_HOUR = 20;
export const SLOT_INTERVAL_MINS = 30;
