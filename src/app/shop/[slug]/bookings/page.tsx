import { redirect } from "next/navigation";

/** Legacy /dashboard-{slug}/bookings → unified queue screen */
export default function ShopBookingsPage() {
  redirect("/dashboard#queue_screen");
}
