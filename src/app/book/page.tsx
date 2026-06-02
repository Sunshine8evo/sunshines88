import type { Metadata } from "next";

import CustomerBookingForm from "@/components/booking/CustomerBookingForm";

export const metadata: Metadata = {
  title: "จองคิวออนไลน์ | Sunshine",
  description: "จองบริการ Spa & Salon ออนไลน์ที่ Sunshine",
};

export default function BookPage() {
  return <CustomerBookingForm />;
}
