"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  createCustomerBooking,
  loadAddons,
  loadBookingsForDate,
  loadServices,
  loadStaffForDate,
} from "@/lib/booking/api";
import type { Addon, Service, Staff } from "@/lib/booking/types";
import {
  buildTimeSlots,
  findAvailableColumn,
  formatMoney,
  getNextAvailableStaff,
  todayISO,
} from "@/lib/booking/utils";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3 | 4;

export default function CustomerBookingForm() {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [addons, setAddons] = useState<Addon[]>([]);

  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [bookingDate, setBookingDate] = useState(todayISO());
  const [time, setTime] = useState("");
  const [selectedAddons, setSelectedAddons] = useState<Addon[]>([]);
  const [staffName, setStaffName] = useState("");
  const [requestStaff, setRequestStaff] = useState(false);
  const [fname, setFname] = useState("");
  const [lname, setLname] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [bookedSlots, setBookedSlots] = useState<
    Awaited<ReturnType<typeof loadBookingsForDate>>
  >([]);
  const [suggestedStaff, setSuggestedStaff] = useState<Staff | null>(null);

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const [svc, add] = await Promise.all([
          loadServices(supabase),
          loadAddons(supabase),
        ]);
        setServices(svc);
        setAddons(add);
        const stf = await loadStaffForDate(supabase, bookingDate);
        setStaff(stf);
      } catch (e) {
        console.error(e);
        setError("ไม่สามารถโหลดข้อมูลบริการได้ กรุณารีเฟรชหน้า");
      } finally {
        setLoading(false);
      }
    }

    loadCatalog();
  }, [supabase, bookingDate]);

  useEffect(() => {
    if (!supabase || loading) return;
    loadStaffForDate(supabase, bookingDate)
      .then(setStaff)
      .catch((e) => console.error("loadStaffForDate:", e));
  }, [supabase, bookingDate, loading]);

  const refreshBookings = useCallback(async () => {
    if (!bookingDate) return;
    const rows = await loadBookingsForDate(supabase, bookingDate);
    setBookedSlots(rows);
  }, [bookingDate, supabase]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("book-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff" },
        () => {
          loadStaffForDate(supabase, bookingDate).then(setStaff);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_schedules" },
        () => {
          loadStaffForDate(supabase, bookingDate).then(setStaff);
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          refreshBookings();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, bookingDate, refreshBookings]);

  const timeSlots = useMemo(() => {
    if (!selectedService) return [];
    return buildTimeSlots(selectedService.duration);
  }, [selectedService]);

  const availableTimes = useMemo(() => {
    if (!selectedService) return [];

    return timeSlots.filter((slot) => {
      const preferred = requestStaff && staffName ? staffName : undefined;
      return !!findAvailableColumn(
        bookingDate,
        slot,
        selectedService.duration,
        staff,
        bookedSlots,
        preferred,
      );
    });
  }, [
    timeSlots,
    selectedService,
    bookingDate,
    staff,
    bookedSlots,
    requestStaff,
    staffName,
  ]);

  useEffect(() => {
    if (!selectedService || !time) {
      setSuggestedStaff(null);
      return;
    }
    const preferred = requestStaff && staffName ? staffName : undefined;
    if (preferred) {
      const pick = staff.find((s) => s.name === preferred && s.status === "on");
      setSuggestedStaff(pick || null);
      return;
    }
    setSuggestedStaff(
      getNextAvailableStaff(
        bookingDate,
        time,
        selectedService.duration,
        staff,
        bookedSlots,
      ),
    );
  }, [
    time,
    bookingDate,
    selectedService,
    staff,
    bookedSlots,
    requestStaff,
    staffName,
  ]);

  const totalPrice = useMemo(() => {
    if (!selectedService) return 0;
    return (
      selectedService.price +
      selectedAddons.reduce((sum, a) => sum + a.price, 0)
    );
  }, [selectedService, selectedAddons]);

  function toggleAddon(addon: Addon) {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      if (exists) return prev.filter((a) => a.name !== addon.name);
      return [...prev, addon];
    });
  }

  async function handleSubmit() {
    if (!selectedService || !time) return;

    setSubmitting(true);
    setError("");

    try {
      const preferred = requestStaff && staffName ? staffName : undefined;
      const assignment = findAvailableColumn(
        bookingDate,
        time,
        selectedService.duration,
        staff,
        bookedSlots,
        preferred,
      );

      if (!assignment) {
        setError("ช่วงเวลานี้ไม่ว่างแล้ว กรุณาเลือกเวลาอื่น");
        setSubmitting(false);
        return;
      }

      await createCustomerBooking(
        supabase,
        {
          service: selectedService,
          bookingDate,
          time,
          fname: fname.trim(),
          lname: lname.trim(),
          phone: phone.trim(),
          notes: notes.trim(),
          staffName,
          requestStaff,
          addons: selectedAddons,
        },
        assignment,
      );

      setSuccess(true);
    } catch (e) {
      console.error(e);
      setError(
        e instanceof Error ? e.message : "บันทึกการจองไม่สำเร็จ กรุณาลองใหม่",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setStep(1);
    setSuccess(false);
    setError("");
    setSelectedService(null);
    setBookingDate(todayISO());
    setTime("");
    setSelectedAddons([]);
    setStaffName("");
    setRequestStaff(false);
    setFname("");
    setLname("");
    setPhone("");
    setNotes("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fdf0f3]">
        <p className="text-sm text-[#666]">กำลังโหลด...</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdf0f3] via-[#fff5f7] to-[#fce4ec] px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#f5c6d0] bg-white p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#eaf6ef] text-2xl text-[#2a8a52]">
            ✓
          </div>
          <h1 className="text-xl font-semibold text-[#1a1a1a]">
            จองสำเร็จ!
          </h1>
          <p className="mt-2 text-sm text-[#666]">
            เราได้รับคำขอจองของคุณแล้ว ทีมงานจะติดต่อกลับเพื่อยืนยัน
          </p>
          {selectedService && (
            <div className="mt-6 rounded-xl bg-[#fafafa] p-4 text-left text-sm">
              <p>
                <span className="text-[#888]">บริการ:</span>{" "}
                {selectedService.name}
              </p>
              <p className="mt-1">
                <span className="text-[#888]">วันที่:</span> {bookingDate}{" "}
                {time}
              </p>
              <p className="mt-1">
                <span className="text-[#888]">ราคาโดยประมาณ:</span>{" "}
                {formatMoney(totalPrice)}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={resetForm}
            className="mt-6 w-full rounded-lg bg-[#e85d7a] py-3 text-sm font-medium text-white transition hover:bg-[#b8334f]"
          >
            จองอีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdf0f3] via-[#fff5f7] to-[#fce4ec]">
      <header className="border-b border-[#f5c6d0]/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/assets/sunshine-logo.png"
              alt="Sunshine"
              width={120}
              height={40}
              className="h-8 w-auto object-contain"
              priority
            />
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">
                จองคิวออนไลน์
              </p>
              <p className="text-xs text-[#888]">Sunshine Spa &amp; Salon</p>
            </div>
          </div>
          <span className="rounded-full bg-[#fdf0f3] px-3 py-1 text-xs font-medium text-[#b8334f]">
            ขั้นตอน {step}/4
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        )}

        {step === 1 && (
          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">
              เลือกบริการ
            </h2>
            <p className="mt-1 text-sm text-[#666]">
              เลือกทรีทเมนต์ที่ต้องการ
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {services.map((service) => {
                const selected = selectedService?.name === service.name;
                return (
                  <button
                    key={service.id ?? service.name}
                    type="button"
                    onClick={() => setSelectedService(service)}
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-[#e85d7a] bg-[#fdf0f3] ring-1 ring-[#e85d7a]"
                        : "border-[#e2e2e2] bg-white hover:border-[#e85d7a]/50"
                    }`}
                  >
                    <div className="font-medium text-[#1a1a1a]">
                      {service.name}
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-[#666]">
                      <span>{service.duration} นาที</span>
                      <span className="font-semibold text-[#e85d7a]">
                        {formatMoney(service.price)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className="rounded-lg bg-[#e85d7a] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#b8334f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </section>
        )}

        {step === 2 && selectedService && (
          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">
              เลือกวันและเวลา
            </h2>
            <p className="mt-1 text-sm text-[#666]">
              {selectedService.name} · {selectedService.duration} นาที
            </p>

            <label className="mt-5 block text-xs font-medium text-[#666]">
              วันที่
              <input
                type="date"
                value={bookingDate}
                min={todayISO()}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  setTime("");
                }}
                className="mt-1.5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
              />
            </label>

            {time && selectedService && (
              <div className="mt-4 rounded-xl border border-[#f5c6d0] bg-white px-4 py-3 text-sm">
                <span className="text-[#888]">พนักงานที่ว่าง (ลำดับคิว): </span>
                {suggestedStaff ? (
                  <span className="font-medium text-[#1a1a1a]">
                    {suggestedStaff.name}
                  </span>
                ) : (
                  <span className="font-medium text-[#b91c1c]">
                    No staff available
                  </span>
                )}
              </div>
            )}

            <div className="mt-5">
              <p className="text-xs font-medium text-[#666]">เวลาที่ว่าง</p>
              {availableTimes.length === 0 ? (
                <p className="mt-3 text-sm text-[#888]">
                  ไม่มีช่วงเวลาว่างในวันนี้ ลองเปลี่ยนวันที่
                </p>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {availableTimes.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`rounded-lg border px-2 py-2.5 text-sm transition ${
                        time === slot
                          ? "border-[#e85d7a] bg-[#e85d7a] text-white"
                          : "border-[#e2e2e2] bg-white hover:border-[#e85d7a]/50"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="rounded-lg border border-[#ddd] px-5 py-2.5 text-sm text-[#666]"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                disabled={!time}
                onClick={() => setStep(3)}
                className="rounded-lg bg-[#e85d7a] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#b8334f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          </section>
        )}

        {step === 3 && selectedService && (
          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">
              ตัวเลือกเพิ่มเติม
            </h2>
            <p className="mt-1 text-sm text-[#666]">ไม่บังคับ</p>

            <div className="mt-5">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={requestStaff}
                  onChange={(e) => setRequestStaff(e.target.checked)}
                  className="accent-[#e85d7a]"
                />
                ต้องการระบุพนักงาน
              </label>
              {requestStaff && (
                <select
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
                >
                  <option value="">เลือกพนักงาน</option>
                  {staff.map((s) => (
                    <option key={s.id ?? s.name} value={s.name}>
                      {s.name}
                      {s.full_name && s.full_name !== s.name
                        ? ` (${s.full_name})`
                        : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="mt-6">
              <p className="text-xs font-medium text-[#666]">Add-on</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {addons.map((addon) => {
                  const on = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <button
                      key={addon.id ?? addon.name}
                      type="button"
                      onClick={() => toggleAddon(addon)}
                      className={`rounded-full border px-3 py-1.5 text-xs transition ${
                        on
                          ? "border-[#e85d7a] bg-[#fdf0f3] text-[#b8334f]"
                          : "border-[#ddd] bg-white text-[#666] hover:border-[#e85d7a]/50"
                      }`}
                    >
                      {addon.name} +{formatMoney(addon.price)}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-white p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[#666]">ราคารวมโดยประมาณ</span>
                <span className="font-semibold text-[#e85d7a]">
                  {formatMoney(totalPrice)}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="rounded-lg border border-[#ddd] px-5 py-2.5 text-sm text-[#666]"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                onClick={() => setStep(4)}
                className="rounded-lg bg-[#e85d7a] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#b8334f]"
              >
                ถัดไป
              </button>
            </div>
          </section>
        )}

        {step === 4 && selectedService && (
          <section>
            <h2 className="text-lg font-semibold text-[#1a1a1a]">
              ข้อมูลติดต่อ
            </h2>
            <p className="mt-1 text-sm text-[#666]">
              กรอกชื่อและเบอร์โทรเพื่อยืนยันการจอง
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block text-xs font-medium text-[#666]">
                ชื่อ *
                <input
                  value={fname}
                  onChange={(e) => setFname(e.target.value)}
                  placeholder="ชื่อ"
                  className="mt-1.5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
                />
              </label>
              <label className="block text-xs font-medium text-[#666]">
                นามสกุล
                <input
                  value={lname}
                  onChange={(e) => setLname(e.target.value)}
                  placeholder="นามสกุล"
                  className="mt-1.5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
                />
              </label>
            </div>

            <label className="mt-4 block text-xs font-medium text-[#666]">
              เบอร์โทร *
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08x-xxx-xxxx"
                className="mt-1.5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
              />
            </label>

            <label className="mt-4 block text-xs font-medium text-[#666]">
              หมายเหตุ
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="แจ้งความต้องการพิเศษ (ถ้ามี)"
                className="mt-1.5 w-full rounded-lg border border-[#ddd] px-3 py-2.5 text-sm outline-none focus:border-[#e85d7a]"
              />
            </label>

            <div className="mt-5 rounded-xl border border-[#f5c6d0] bg-white p-4 text-sm">
              <p className="font-medium text-[#1a1a1a]">สรุปการจอง</p>
              <p className="mt-2 text-[#666]">{selectedService.name}</p>
              <p className="text-[#666]">
                {bookingDate} · {time} · {formatMoney(totalPrice)}
              </p>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="rounded-lg border border-[#ddd] px-5 py-2.5 text-sm text-[#666]"
              >
                ย้อนกลับ
              </button>
              <button
                type="button"
                disabled={submitting || !fname.trim() || !phone.trim()}
                onClick={handleSubmit}
                className="rounded-lg bg-[#e85d7a] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#b8334f] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {submitting ? "กำลังบันทึก..." : "ยืนยันการจอง"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
