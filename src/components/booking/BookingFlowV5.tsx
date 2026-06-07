"use client";

import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";

import {
  createCustomerBooking,
  loadAddons,
  loadBookingsForDate,
  loadServices,
  loadStaffForDate,
} from "@/lib/booking/api";
import type { ExistingBooking, Service, Staff } from "@/lib/booking/types";
import {
  buildTimeSlots,
  findAvailableColumn,
  formatTime12h,
  parseTime12h,
} from "@/lib/booking/utils";
import { createClient } from "@/lib/supabase/client";
import SunshineBrandLogo from "@/components/marketing/SunshineBrandLogo";

import "./booking-flow-v5.css";
import {
  DEMO_ADDONS,
  DEMO_LOCATIONS,
  DEMO_SERVICES,
  DEMO_STAFF,
  NEXT_LABELS,
  PRESSURE_OPTIONS,
  STEP_LABELS,
  buildCalendarDays,
  fmtPhoneInput,
  mkClient,
  type BookingType,
  type ClientRecord,
  type DisplayAddon,
  type DisplayService,
  type DisplayStaff,
  type ShopLocation,
} from "./booking-flow-v5-data";

type BookingFlowV5Props = {
  shopName: string;
  shopAddress?: string;
  locations?: ShopLocation[];
  confirmHours?: number;
  shopPhone?: string;
  maxGroup?: number;
  serifClassName?: string;
};

export default function BookingFlowV5({
  shopName,
  shopAddress = "1234 Westheimer Rd, Houston, TX 77006",
  locations,
  confirmHours = 1,
  shopPhone = "(xxx) xxx-xxxx",
  maxGroup = 8,
  serifClassName = "",
}: BookingFlowV5Props) {
  const supabase = useMemo(() => createClient(), []);
  const calendarDays = useMemo(() => buildCalendarDays(), []);
  const [workingStaff, setWorkingStaff] = useState<Staff[]>([]);
  const [bookedSlots, setBookedSlots] = useState<ExistingBooking[]>([]);

  const shopLocations = locations?.length ? locations : DEMO_LOCATIONS;
  const multiLocation = shopLocations.length > 1;

  const [services] = useState<DisplayService[]>(DEMO_SERVICES);
  const [staffList, setStaffList] = useState<DisplayStaff[]>(DEMO_STAFF);
  const [addons] = useState<DisplayAddon[]>(DEMO_ADDONS);

  const [page, setPage] = useState(1);
  const [bookingType, setBookingType] = useState<BookingType>("solo");
  const [numClients, setNumClients] = useState(1);

  const [service, setService] = useState(DEMO_SERVICES[0].name);
  const [servicePrice, setServicePrice] = useState(DEMO_SERVICES[0].basePrice);
  const [duration, setDuration] = useState("");
  const [durAdd, setDurAdd] = useState(0);
  const [pressure, setPressure] = useState("");
  const [addonsMain, setAddonsMain] = useState<string[]>([]);
  const [addonTotal, setAddonTotal] = useState(0);

  const [clients, setClients] = useState<ClientRecord[]>(
    Array.from({ length: 8 }, () => mkClient()),
  );

  const [selectedLocation, setSelectedLocation] = useState<ShopLocation | null>(
    multiLocation ? null : shopLocations[0] ?? null,
  );
  const [barName, setBarName] = useState(shopName);
  const [barAddr, setBarAddr] = useState(shopAddress);

  const [selectedDateIso, setSelectedDateIso] = useState(calendarDays[0]?.iso ?? "");
  const [dateLabel, setDateLabel] = useState(calendarDays[0]?.label ?? "");
  const [time, setTime] = useState("");
  const [roomPref, setRoomPref] = useState<"same" | "separate">("same");

  const [staffSelections, setStaffSelections] = useState<Record<number, string>>({});
  const [activeStaffTab, setActiveStaffTab] = useState(0);
  const [genderPref, setGenderPref] = useState("none");
  const [payMethod, setPayMethod] = useState("location");
  const [giftCode, setGiftCode] = useState("");

  const [popupOpen, setPopupOpen] = useState(false);
  const [editingIdx, setEditingIdx] = useState(0);
  const [popupFname, setPopupFname] = useState("");
  const [popupLname, setPopupLname] = useState("");
  const [popupPhone, setPopupPhone] = useState("");
  const [popupEmail, setPopupEmail] = useState("");
  const [pSvc, setPSvc] = useState(DEMO_SERVICES[0].name);
  const [pSvcPrice, setPSvcPrice] = useState(DEMO_SERVICES[0].basePrice);
  const [pDuration, setPDuration] = useState("");
  const [pDurAdd, setPDurAdd] = useState(0);
  const [pPressure, setPPressure] = useState("");
  const [pAddons, setPAddons] = useState<string[]>([]);
  const [pAddonTotal, setPAddonTotal] = useState(0);

  const [confNum, setConfNum] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const activeService = services.find((s) => s.name === service) ?? services[0];
  const heroService = services[0];

  const effectiveDuration = useMemo(() => {
    const primary = Number(duration) || 60;
    let max = primary;
    for (let i = 1; i < numClients; i++) {
      const cl = clients[i];
      if (cl.filled && cl.duration) {
        max = Math.max(max, Number(cl.duration) || primary);
      }
    }
    return max;
  }, [duration, numClients, clients]);

  const timeSlots24 = useMemo(
    () => (effectiveDuration ? buildTimeSlots(effectiveDuration) : []),
    [effectiveDuration],
  );

  const displayTimeSlots = useMemo(
    () => timeSlots24.map((slot) => formatTime12h(slot)),
    [timeSlots24],
  );

  const refreshBookings = useCallback(async () => {
    if (!selectedDateIso) return;
    const rows = await loadBookingsForDate(supabase, selectedDateIso);
    setBookedSlots(rows);
  }, [selectedDateIso, supabase]);

  const availableTimeSet = useMemo(() => {
    if (!selectedDateIso || !effectiveDuration || !workingStaff.length) {
      return new Set<string>();
    }

    const available = new Set<string>();
    const preferredStaffId = staffSelections[0];
    const preferredStaffName =
      preferredStaffId && preferredStaffId !== "any"
        ? staffList.find((s) => s.id === preferredStaffId)?.name
        : undefined;

    for (const slot24 of timeSlots24) {
      if (
        findAvailableColumn(
          selectedDateIso,
          slot24,
          effectiveDuration,
          workingStaff,
          bookedSlots,
          preferredStaffName,
        )
      ) {
        available.add(formatTime12h(slot24));
      }
    }
    return available;
  }, [
    selectedDateIso,
    effectiveDuration,
    workingStaff,
    bookedSlots,
    timeSlots24,
    staffSelections,
    staffList,
  ]);

  useEffect(() => {
    async function loadCatalog() {
      try {
        const dateIso = selectedDateIso || calendarDays[0].iso;
        const [svc, add, staff] = await Promise.all([
          loadServices(supabase),
          loadAddons(supabase),
          loadStaffForDate(supabase, dateIso),
        ]);
        setWorkingStaff(staff);
        if (staff.length) {
          setStaffList(
            staff.map((s) => ({
              id: s.id ?? s.name.toLowerCase(),
              name: s.name,
              days: "Available today",
            })),
          );
        }
        void svc;
        void add;
      } catch (e) {
        console.error("BookingFlowV5 catalog:", e);
      }
    }
    loadCatalog();
  }, [supabase, selectedDateIso, calendarDays]);

  useEffect(() => {
    refreshBookings();
  }, [refreshBookings]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel("bf5-book-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          refreshBookings();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff" },
        () => {
          loadStaffForDate(supabase, selectedDateIso).then((rows) => {
            setWorkingStaff(rows);
            if (rows.length) {
              setStaffList(
                rows.map((s) => ({
                  id: s.id ?? s.name.toLowerCase(),
                  name: s.name,
                  days: "Available today",
                })),
              );
            }
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "staff_schedules" },
        () => {
          loadStaffForDate(supabase, selectedDateIso).then((rows) => {
            setWorkingStaff(rows);
            if (rows.length) {
              setStaffList(
                rows.map((s) => ({
                  id: s.id ?? s.name.toLowerCase(),
                  name: s.name,
                  days: "Available today",
                })),
              );
            }
          });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, selectedDateIso, refreshBookings]);

  useEffect(() => {
    if (time && !availableTimeSet.has(time)) {
      setTime("");
    }
  }, [time, availableTimeSet]);

  const calcPrice = useCallback(() => {
    let total = servicePrice + durAdd + addonTotal;
    for (let i = 1; i < numClients; i++) {
      const cl = clients[i];
      if (cl.filled) total += cl.servicePrice + cl.durAdd + cl.addonTotal;
      else total += servicePrice + durAdd;
    }
    return total;
  }, [servicePrice, durAdd, addonTotal, numClients, clients]);

  const totalPrice = calcPrice();

  function updateShopBar(loc: ShopLocation | null) {
    if (!loc) return;
    setBarName(loc.name);
    setBarAddr(loc.addr);
  }

  function setType(type: BookingType) {
    setBookingType(type);
    const n = type === "solo" ? 1 : type === "couple" ? 2 : 3;
    setNumClients(n);
  }

  function selectSvc(svc: DisplayService) {
    setService(svc.name);
    setServicePrice(svc.basePrice);
    setDuration("");
    setDurAdd(0);
  }

  function onDurChange(val: string) {
    setDuration(val);
    const d = activeService.durations.find((x) => x.v === val);
    setDurAdd(d?.add ?? 0);
  }

  function toggleMainAddon(name: string, price: number) {
    setAddonsMain((prev) => {
      const has = prev.includes(name);
      if (has) {
        setAddonTotal((t) => t - price);
        return prev.filter((a) => a !== name);
      }
      setAddonTotal((t) => t + price);
      return [...prev, name];
    });
  }

  function openPopup(idx: number) {
    const cl = clients[idx];
    setEditingIdx(idx);
    setPopupFname(cl.fname);
    setPopupLname(cl.lname);
    setPopupPhone(cl.phone);
    setPopupEmail(cl.email);
    if (idx > 0) {
      setPSvc(cl.service || DEMO_SERVICES[0].name);
      setPSvcPrice(cl.servicePrice || DEMO_SERVICES[0].basePrice);
      setPDuration(cl.duration);
      setPDurAdd(cl.durAdd);
      setPPressure(cl.pressure);
      setPAddons([...(cl.addons || [])]);
      setPAddonTotal(cl.addonTotal);
    }
    setPopupOpen(true);
  }

  function confirmClient() {
    if (!popupFname.trim() || !popupPhone.trim()) {
      alert("Please enter First Name and Phone.");
      return;
    }
    const next = [...clients];
    if (editingIdx === 0) {
      next[0] = {
        ...next[0],
        fname: popupFname.trim(),
        lname: popupLname.trim(),
        phone: popupPhone.trim(),
        email: popupEmail.trim(),
        filled: true,
      };
    } else {
      const durOpts = services.find((s) => s.name === pSvc)?.durations ?? [];
      const d = durOpts.find((x) => x.v === pDuration);
      next[editingIdx] = {
        fname: popupFname.trim(),
        lname: popupLname.trim(),
        phone: popupPhone.trim(),
        email: popupEmail.trim(),
        service: pSvc,
        servicePrice: pSvcPrice,
        duration: pDuration,
        durAdd: d?.add ?? 0,
        pressure: pPressure,
        addons: [...pAddons],
        addonTotal: pAddonTotal,
        filled: true,
      };
    }
    setClients(next);
    setPopupOpen(false);
  }

  function addClient() {
    const maxN = bookingType === "couple" ? 2 : maxGroup;
    if (numClients < maxN) setNumClients((n) => n + 1);
  }

  function goTo(n: number) {
    setPage(n);
    window.scrollTo(0, 0);
  }

  function nextPage() {
    if (page === 1 && !duration) {
      alert("Please select a duration.");
      return;
    }
    if (page === 2 && !time) {
      alert("Please select a time.");
      return;
    }
    if (page === 4) {
      void submitBooking();
      return;
    }
    if (page < 5) goTo(page + 1);
  }

  function prevPage() {
    if (page > 1) goTo(page - 1);
  }

  async function submitBooking() {
    if (!duration || !time) {
      alert("Please select a duration and time.");
      return;
    }

    setSubmitting(true);
    try {
      const time24 = parseTime12h(time);
      const preferredStaffId = staffSelections[0];
      const preferredStaffName =
        preferredStaffId && preferredStaffId !== "any"
          ? staffList.find((s) => s.id === preferredStaffId)?.name
          : undefined;

      const assignment = findAvailableColumn(
        selectedDateIso,
        time24,
        effectiveDuration,
        workingStaff,
        bookedSlots,
        preferredStaffName,
      );

      if (!assignment) {
        alert("That time slot is no longer available. Please choose another time.");
        goTo(2);
        return;
      }

      const num = `HTM-${Math.floor(100000 + Math.random() * 900000)}`;
      setConfNum(num);

      const svcObj: Service = {
        name: service,
        price: servicePrice + durAdd,
        duration: Number(duration) || 60,
        type: bookingType,
      };

      const primary = clients[0];
      if (primary.fname && primary.phone) {
        await createCustomerBooking(
          supabase,
          {
            service: svcObj,
            bookingDate: selectedDateIso,
            time: time24,
            fname: primary.fname,
            lname: primary.lname,
            phone: primary.phone,
            notes: [
              giftCode ? `Gift: ${giftCode}` : "",
              pressure ? `Pressure: ${pressure}` : "",
              addonsMain.length ? `Add-ons: ${addonsMain.join(", ")}` : "",
              selectedLocation ? `Location: ${selectedLocation.name}` : "",
            ]
              .filter(Boolean)
              .join(" | "),
            staffName: assignment.staff,
            requestStaff: !!preferredStaffName,
            addons: addonsMain.map((n) => {
              const a = addons.find((x) => x.name === n);
              return { name: n, price: a?.price ?? 0 };
            }),
          },
          assignment,
        );
      }

      goTo(5);
    } catch (e) {
      console.error(e);
      alert("Could not submit booking. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const takenStaffIds = Object.entries(staffSelections)
    .filter(([k, v]) => parseInt(k, 10) !== activeStaffTab && v !== "any")
    .map(([, v]) => v);

  const curStaffSel = staffSelections[activeStaffTab] ?? "any";

  const showPriceBar = !!duration && page < 5;
  const showBottomBar = page !== 5;

  return (
    <div
      className="bf5-root"
      style={
        {
          "--bf5-font-serif": serifClassName ? "var(--font-serif)" : undefined,
        } as CSSProperties
      }
    >
      <div className="bf5-app">
        <div className="bf5-shop-bar">
          <div>
            <div className={`bf5-sn ${serifClassName}`}>{barName}</div>
            <div className="bf5-sa">📍 {barAddr}</div>
          </div>
          <SunshineBrandLogo width={100} className="bf5-brand-logo" />
        </div>

        <div className="bf5-step-bar">
          <div className="bf5-step-dots">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`bf5-step-dot${i < page ? " done" : ""}${i === page ? " active" : ""}`}
              />
            ))}
          </div>
          <div className="bf5-step-label">
            Step <strong>{page}</strong> of 5 — {STEP_LABELS[page]}
          </div>
        </div>

        {/* PAGE 1 */}
        <div className={`bf5-page${page === 1 ? " active" : ""}`}>
          <div className="bf5-hero">
            <div className="bf5-hero-tag">⭐ Best of Service This Month</div>
            <h1 className={serifClassName}>
              {heroService.name.includes("&") ? (
                <>
                  {heroService.name.split("&")[0]?.trim()}
                  <br />& {heroService.name.split("&")[1]?.trim()}
                </>
              ) : (
                heroService.name
              )}
            </h1>
            <p>
              Most Popular · from ${heroService.basePrice} ·{" "}
              {heroService.sub}
            </p>
          </div>

          <div className="bf5-sec-title">Location</div>
          {multiLocation ? (
            <select
              className="bf5-location-select-box"
              value={selectedLocation?.id ?? ""}
              onChange={(e) => {
                const loc = shopLocations.find((l) => l.id === e.target.value) ?? null;
                setSelectedLocation(loc);
                updateShopBar(loc);
              }}
            >
              <option value="">Select a location…</option>
              {shopLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="bf5-location-single">
              <span>📍</span>
              <span className="bf5-ls-name">{shopLocations[0]?.name ?? shopName}</span>
            </div>
          )}

          <div className="bf5-sec-title">Booking Type</div>
          <div className="bf5-type-row">
            {(
              [
                ["solo", "🧘", "Solo"],
                ["couple", "💑", "Couple"],
                ["group", "👥", "Group"],
              ] as const
            ).map(([type, icon, label]) => (
              <button
                key={type}
                type="button"
                className={`bf5-type-chip${bookingType === type ? " selected" : ""}`}
                onClick={() => setType(type)}
              >
                <span className="bf5-tc-icon">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div>
            {Array.from({ length: numClients }, (_, i) => {
              const cl = clients[i];
              return (
                <button
                  key={i}
                  type="button"
                  className={`bf5-client-slot${cl.filled ? " filled" : ""}`}
                  onClick={() => openPopup(i)}
                >
                  <div className="bf5-cs-num">{i + 1}</div>
                  <div className="bf5-cs-info">
                    <div className="bf5-cs-name">
                      {cl.filled
                        ? `${cl.fname}${cl.lname ? ` ${cl.lname}` : ""}`
                        : `Client ${i + 1}`}
                    </div>
                    <div className="bf5-cs-sub">
                      {cl.filled
                        ? i === 0
                          ? cl.phone
                          : `${cl.service} · ${cl.phone}`
                        : i === 0
                          ? "Tap to enter name & phone"
                          : "Tap to enter details"}
                    </div>
                  </div>
                  <div className="bf5-cs-arrow">›</div>
                </button>
              );
            })}
          </div>

          {bookingType !== "solo" && numClients < (bookingType === "couple" ? 2 : maxGroup) ? (
            <button type="button" className="bf5-add-client-btn" onClick={addClient}>
              + Add Client
            </button>
          ) : null}

          <div className="bf5-divider" />
          <div className={`bf5-sec-title ${serifClassName}`}>Choose Service</div>
          {services.map((svc) => (
            <button
              key={svc.id}
              type="button"
              className={`bf5-svc-card${service === svc.name ? " selected" : ""}`}
              onClick={() => selectSvc(svc)}
            >
              <div className="bf5-si">{svc.icon}</div>
              <div className="bf5-sinfo">
                <div className={`bf5-sname ${serifClassName}`}>{svc.name}</div>
                <div className="bf5-ssub">{svc.sub}</div>
                {svc.badge ? (
                  <span
                    className={`bf5-svc-badge bf5-badge-${svc.badge.variant}`}
                  >
                    {svc.badge.text}
                  </span>
                ) : null}
              </div>
              <div className="bf5-svc-price">from ${svc.basePrice}</div>
            </button>
          ))}

          <div className="bf5-divider" />
          <div className="bf5-field">
            <label>
              Duration <span className="bf5-req">*</span>
            </label>
            <select value={duration} onChange={(e) => onDurChange(e.target.value)}>
              <option value="">Select duration</option>
              {activeService.durations.map((d) => (
                <option key={d.v} value={d.v}>
                  {d.v} min{d.add ? ` (+$${d.add})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="bf5-divider" />
          <div className={`bf5-sec-title ${serifClassName}`}>Pressure Level</div>
          <div className="bf5-two-col">
            {PRESSURE_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`bf5-opt-chip${pressure === p.id ? " selected" : ""}`}
                onClick={() => setPressure(p.id)}
              >
                <div className="bf5-ol">{p.label}</div>
                <div className="bf5-op">{p.sub}</div>
              </button>
            ))}
          </div>

          <div className="bf5-divider" />
          <div className={`bf5-sec-title ${serifClassName}`}>
            Add-ons <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)" }}>(Optional)</span>
          </div>
          <div className="bf5-two-col">
            {addons.map((a) => (
              <button
                key={a.name}
                type="button"
                className={`bf5-opt-chip${addonsMain.includes(a.name) ? " selected" : ""}`}
                onClick={() => toggleMainAddon(a.name, a.price)}
              >
                <div className="bf5-ol">
                  {a.icon} {a.short}
                </div>
                <div className="bf5-op">+${a.price}</div>
              </button>
            ))}
          </div>
        </div>

        {/* PAGE 2 */}
        <div className={`bf5-page${page === 2 ? " active" : ""}`}>
          <div className={`bf5-sec-title ${serifClassName}`}>Select Date</div>
          <div className="bf5-cal-strip">
            {calendarDays.map((d) => (
              <button
                key={d.iso}
                type="button"
                className={`bf5-cal-day${selectedDateIso === d.iso ? " selected" : ""}`}
                onClick={() => {
                  setSelectedDateIso(d.iso);
                  setDateLabel(d.label);
                }}
              >
                <div className="bf5-wd">{d.weekday}</div>
                <div className="bf5-dn">{d.dayNum}</div>
              </button>
            ))}
          </div>

          <div className={`bf5-sec-title ${serifClassName}`}>Available Times</div>
          {!duration ? (
            <p className="text-sm text-[var(--muted)]">
              Select a service duration on step 1 to see open times.
            </p>
          ) : displayTimeSlots.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              No time slots for this date. Try another day.
            </p>
          ) : (
            <div className="bf5-time-grid">
              {displayTimeSlots.map((t) => {
                const open = availableTimeSet.has(t);
                return (
                  <button
                    key={t}
                    type="button"
                    disabled={!open}
                    className={`bf5-time-chip${time === t ? " selected" : ""}${!open ? " unavail" : ""}`}
                    onClick={() => setTime(t)}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          )}

          {bookingType !== "solo" ? (
            <div className="bf5-room-section">
              <div className="bf5-divider" />
              <div className={`bf5-sec-title ${serifClassName}`}>Room Selection</div>
              {(
                [
                  ["same", "🛋️", "Same Room", "All guests in one shared room"],
                  ["separate", "🚪", "Separate Rooms", "Each guest in their own room"],
                ] as const
              ).map(([val, icon, title, sub]) => (
                <button
                  key={val}
                  type="button"
                  className={`bf5-room-option${roomPref === val ? " selected" : ""}`}
                  onClick={() => setRoomPref(val)}
                >
                  <div style={{ fontSize: 22 }}>{icon}</div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>{sub}</div>
                  </div>
                  <div className="bf5-room-dot" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* PAGE 3 */}
        <div className={`bf5-page${page === 3 ? " active" : ""}`}>
          {numClients > 1 ? (
            <div style={{ marginBottom: 4 }}>
              <div className={`bf5-sec-title ${serifClassName}`}>
                Select Staff for Each Client
              </div>
              <div className="bf5-client-tabs">
                {Array.from({ length: numClients }, (_, i) => {
                  const cl = clients[i];
                  const name =
                    i === 0 ? "Client 1" : cl.filled ? cl.fname : `Client ${i + 1}`;
                  return (
                    <button
                      key={i}
                      type="button"
                      className={`bf5-client-tab${activeStaffTab === i ? " active" : ""}`}
                      onClick={() => setActiveStaffTab(i)}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className={`bf5-sec-title ${serifClassName}`}>Therapist Preference</div>
          )}

          <div className="bf5-therapist-grid">
            <button
              type="button"
              className={`bf5-any-card${curStaffSel === "any" ? " selected" : ""}`}
              onClick={() =>
                setStaffSelections((s) => ({ ...s, [activeStaffTab]: "any" }))
              }
            >
              <span style={{ fontSize: 20 }}>🎲</span>
              <span>
                <strong style={{ fontSize: 14 }}>Any Available</strong>
                <br />
                <span style={{ fontSize: 12, color: "var(--muted)" }}>
                  Best match for your time
                </span>
              </span>
            </button>
            {staffList.map((s) => {
              const taken = takenStaffIds.includes(s.id);
              const sel = curStaffSel === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={taken}
                  className={`bf5-t-card${sel ? " selected" : ""}${taken ? " taken" : ""}`}
                  onClick={() =>
                    setStaffSelections((st) => ({ ...st, [activeStaffTab]: s.id }))
                  }
                >
                  <div className="bf5-t-avatar">🧖‍♀️</div>
                  <div className="bf5-t-name">{s.name}</div>
                  <div className="bf5-t-days">{s.days}</div>
                </button>
              );
            })}
          </div>

          <div className={`bf5-sec-title ${serifClassName}`}>Gender Preference</div>
          <div className="bf5-gender-opts">
            {(
              [
                ["none", "No Pref"],
                ["female", "Female Staff"],
                ["male", "Male Staff"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                className={`bf5-gender-opt${genderPref === val ? " selected" : ""}`}
                onClick={() => setGenderPref(val)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* PAGE 4 */}
        <div className={`bf5-page${page === 4 ? " active" : ""}`}>
          <div className={`bf5-sec-title ${serifClassName}`}>Booking Summary</div>
          <div className="bf5-sum-box">
            <h3 className={serifClassName}>Appointment Info</h3>
            <div className="bf5-sum-row">
              <span className="bf5-key">Type</span>
              <span className="bf5-val">
                {bookingType.charAt(0).toUpperCase() + bookingType.slice(1)}
              </span>
            </div>
            <div className="bf5-sum-row">
              <span className="bf5-key">Date &amp; Time</span>
              <span className="bf5-val">
                {dateLabel && time ? `${dateLabel} @ ${time}` : "—"}
              </span>
            </div>
            {bookingType !== "solo" ? (
              <div className="bf5-sum-row">
                <span className="bf5-key">Room</span>
                <span className="bf5-val">
                  {roomPref === "same" ? "Same Room" : "Separate Rooms"}
                </span>
              </div>
            ) : null}
          </div>

          {Array.from({ length: numClients }, (_, i) => {
            const cl = clients[i];
            const svcName = i === 0 ? service : cl.service;
            const dur = i === 0 ? duration : cl.duration;
            const pres = i === 0 ? pressure : cl.pressure;
            const adds = i === 0 ? addonsMain : cl.addons;
            const sub =
              i === 0
                ? servicePrice + durAdd + addonTotal
                : cl.servicePrice + (cl.durAdd || 0) + (cl.addonTotal || 0);
            const staffId = staffSelections[i] ?? "any";
            const staffName =
              staffId === "any"
                ? "Any Available"
                : staffList.find((s) => s.id === staffId)?.name ?? "—";
            const nm =
              i === 0
                ? "Client 1"
                : cl.filled
                  ? `${cl.fname}${cl.lname ? ` ${cl.lname}` : ""}`
                  : `Client ${i + 1}`;

            return (
              <div key={i} className="bf5-client-sum-card">
                <div className="bf5-csc-header">
                  <div className="bf5-csc-num">{i + 1}</div>
                  <div className="bf5-csc-name">{nm}</div>
                </div>
                {i > 0 ? (
                  <div className="bf5-csc-row">
                    <span className="bf5-k">Phone</span>
                    <span>{cl.phone || "—"}</span>
                  </div>
                ) : null}
                <div className="bf5-csc-row">
                  <span className="bf5-k">Service</span>
                  <span>{svcName || "—"}</span>
                </div>
                <div className="bf5-csc-row">
                  <span className="bf5-k">Duration</span>
                  <span>{dur ? `${dur} min` : "—"}</span>
                </div>
                <div className="bf5-csc-row">
                  <span className="bf5-k">Pressure</span>
                  <span>{pres || "—"}</span>
                </div>
                <div className="bf5-csc-row">
                  <span className="bf5-k">Add-ons</span>
                  <span>{adds.length ? adds.join(", ") : "None"}</span>
                </div>
                <div className="bf5-csc-row">
                  <span className="bf5-k">Staff</span>
                  <span>{staffName}</span>
                </div>
                <div className="bf5-csc-row" style={{ fontWeight: 600 }}>
                  <span className="bf5-k">Subtotal</span>
                  <span style={{ color: "var(--purple-dark)" }}>${sub}</span>
                </div>
              </div>
            );
          })}

          <div className="bf5-total-highlight">
            <div className="bf5-tl">Total Estimate</div>
            <div className={`bf5-ta ${serifClassName}`}>${totalPrice}</div>
            {numClients > 1 ? (
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                ({numClients} guests total)
              </div>
            ) : null}
          </div>

          <div className={`bf5-sec-title ${serifClassName}`}>Payment</div>
          <button
            type="button"
            className={`bf5-pay-option${payMethod === "location" ? " selected" : ""}`}
            onClick={() => setPayMethod("location")}
          >
            <div style={{ fontSize: 20 }}>💵</div>
            <div style={{ flex: 1, textAlign: "left" }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Pay at Location</div>
              <div style={{ fontSize: 12, color: "var(--muted)" }}>
                Cash, Card, or other accepted methods
              </div>
            </div>
            <div className="bf5-pay-dot" />
          </button>

          <div className="bf5-field" style={{ marginTop: 14 }}>
            <label>Gift Card / Package Code (Optional)</label>
            <input
              type="text"
              value={giftCode}
              onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
              placeholder="Enter code…"
            />
          </div>

          <div className="bf5-notice">
            <strong>⚠️ Please Read Before Confirming</strong>
            <ul style={{ marginTop: 8 }}>
              <li>
                Customers must confirm before the session.{" "}
                <strong>({confirmHours} hour before)</strong>
              </li>
              <li>No check-in within <strong>10 mins</strong> of start = auto-cancel.</li>
              <li>Late arrival? We can hold for <strong>10 mins max</strong> only.</li>
              <li>
                Groups of <strong>3+</strong> require 50% deposit. <strong>NO REFUND.</strong>
              </li>
              <li>
                If auto-cancelled with deposit paid — <strong>no refund</strong>.
              </li>
              <li>
                To reduce risk, please <strong>call or reschedule</strong> before your
                appointment.
              </li>
            </ul>
          </div>
        </div>

        {/* PAGE 5 */}
        <div className={`bf5-page${page === 5 ? " active" : ""}`}>
          <div style={{ textAlign: "center", padding: "10px 0 20px" }}>
            <div style={{ fontSize: 50, marginBottom: 10 }}>🎉</div>
            <div
              className={serifClassName}
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "var(--purple-dark)",
              }}
            >
              Booking Confirmed!
            </div>
            <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 5 }}>
              A confirmation text will be sent shortly.
            </div>
          </div>
          <div className="bf5-conf-box">
            <div className="bf5-cn-label">Confirmation Number</div>
            <div className={`bf5-cn-num ${serifClassName}`}>{confNum}</div>
            <div className="bf5-cn-sub">Please show this number when you arrive.</div>
          </div>
          <div className="bf5-sum-box">
            <h3 className={serifClassName}>Your Appointment</h3>
            <div className="bf5-sum-row">
              <span className="bf5-key">Service</span>
              <span className="bf5-val">
                {service}
                {duration ? ` (${duration} min)` : ""}
              </span>
            </div>
            <div className="bf5-sum-row">
              <span className="bf5-key">Date &amp; Time</span>
              <span className="bf5-val">
                {dateLabel && time ? `${dateLabel} @ ${time}` : "—"}
              </span>
            </div>
            <div className="bf5-sum-row">
              <span className="bf5-key">Guests</span>
              <span className="bf5-val">
                {numClients} guest{numClients > 1 ? "s" : ""}
              </span>
            </div>
            <div className="bf5-sum-row">
              <span className="bf5-key">Location</span>
              <span className="bf5-val">{barAddr.split(",").slice(-2).join(",")}</span>
            </div>
            <div className="bf5-sum-row">
              <span className="bf5-key">Payment</span>
              <span className="bf5-val">Pay at location</span>
            </div>
          </div>
          <div
            className="bf5-notice"
            style={{
              background: "var(--purple-light)",
              borderColor: "var(--purple)",
            }}
          >
            📱 Reply <strong>Y</strong> to confirm or <strong>N</strong> to cancel.
            <br />
            No reply = <strong>booking auto-cancelled</strong>. If deposit was paid →{" "}
            <strong>no refund</strong>.
            <br />
            Need to reschedule? Contact us at <strong>{shopPhone}</strong> at least{" "}
            <strong>{confirmHours}</strong> hour before your appointment.
          </div>
          <div style={{ textAlign: "center", marginTop: 16 }}>
            <button
              type="button"
              className="bf5-btn-next"
              style={{ maxWidth: 280, width: "100%" }}
              onClick={() => window.location.reload()}
            >
              Book Another Session
            </button>
          </div>
        </div>

        {showPriceBar ? (
          <div className="bf5-price-bar">
            Estimated: <strong>${totalPrice}</strong>
          </div>
        ) : null}

        {showBottomBar ? (
          <div className="bf5-bottom-bar">
            {page > 1 ? (
              <button type="button" className="bf5-btn-back" onClick={prevPage}>
                ← Back
              </button>
            ) : null}
            <button
              type="button"
              className="bf5-btn-next"
              disabled={submitting}
              onClick={nextPage}
            >
              {submitting ? "Submitting…" : NEXT_LABELS[page]}
            </button>
          </div>
        ) : null}

        <div className="bf5-powered-by">
          🌞 <span>Sunshine Evolution Technology</span> system
        </div>
      </div>

      {/* CLIENT POPUP */}
      <div className={`bf5-popup-overlay${popupOpen ? " open" : ""}`}>
        <div className="bf5-popup-sheet">
          <div className="bf5-popup-handle" />
          <button type="button" className="bf5-popup-close" onClick={() => setPopupOpen(false)}>
            ✕
          </button>
          <div className={`bf5-popup-title ${serifClassName}`}>
            Client {editingIdx + 1}
          </div>

          <div className="bf5-field-row">
            <div className="bf5-field">
              <label>
                First Name <span className="bf5-req">*</span>
              </label>
              <input
                type="text"
                value={popupFname}
                onChange={(e) => setPopupFname(e.target.value)}
                placeholder="First"
              />
            </div>
            <div className="bf5-field">
              <label>Last Name</label>
              <input
                type="text"
                value={popupLname}
                onChange={(e) => setPopupLname(e.target.value)}
                placeholder="Last"
              />
            </div>
          </div>
          <div className="bf5-field">
            <label>
              Phone <span className="bf5-req">*</span>
            </label>
            <input
              type="tel"
              value={popupPhone}
              maxLength={14}
              onChange={(e) => setPopupPhone(fmtPhoneInput(e.target.value))}
              placeholder="(xxx) xxx-xxxx"
            />
          </div>
          <div className="bf5-field">
            <label>Email (Optional)</label>
            <input
              type="email"
              value={popupEmail}
              onChange={(e) => setPopupEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>

          {editingIdx > 0 ? (
            <>
              <div className="bf5-divider" />
              <div className={`bf5-sec-title ${serifClassName}`} style={{ fontSize: 16 }}>
                Choose Service
              </div>
              {services.map((svc) => (
                <button
                  key={svc.id}
                  type="button"
                  className={`bf5-svc-card${pSvc === svc.name ? " selected" : ""}`}
                  style={{ padding: "10px 14px", marginBottom: 8 }}
                  onClick={() => {
                    setPSvc(svc.name);
                    setPSvcPrice(svc.basePrice);
                    setPDuration("");
                    setPDurAdd(0);
                  }}
                >
                  <div className="bf5-si" style={{ fontSize: 20 }}>
                    {svc.icon}
                  </div>
                  <div className="bf5-sinfo">
                    <div className={`bf5-sname ${serifClassName}`} style={{ fontSize: 14 }}>
                      {svc.name}
                    </div>
                  </div>
                  <div className="bf5-svc-price" style={{ fontSize: 13 }}>
                    ${svc.basePrice}+
                  </div>
                </button>
              ))}
              <div className="bf5-field">
                <label>
                  Duration <span className="bf5-req">*</span>
                </label>
                <select
                  value={pDuration}
                  onChange={(e) => {
                    const v = e.target.value;
                    setPDuration(v);
                    const d = services.find((s) => s.name === pSvc)?.durations.find((x) => x.v === v);
                    setPDurAdd(d?.add ?? 0);
                  }}
                >
                  <option value="">Select duration</option>
                  {(services.find((s) => s.name === pSvc)?.durations ?? []).map((d) => (
                    <option key={d.v} value={d.v}>
                      {d.v} min{d.add ? ` (+$${d.add})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className={`bf5-sec-title ${serifClassName}`} style={{ fontSize: 16 }}>
                Pressure Level
              </div>
              <div className="bf5-two-col">
                {PRESSURE_OPTIONS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`bf5-opt-chip${pPressure === p.id ? " selected" : ""}`}
                    onClick={() => setPPressure(p.id)}
                  >
                    <div className="bf5-ol">{p.label}</div>
                    <div className="bf5-op">{p.sub}</div>
                  </button>
                ))}
              </div>
              <div className={`bf5-sec-title ${serifClassName}`} style={{ fontSize: 16 }}>
                Add-ons (Optional)
              </div>
              <div className="bf5-two-col">
                {addons.map((a) => (
                  <button
                    key={a.name}
                    type="button"
                    className={`bf5-opt-chip${pAddons.includes(a.name) ? " selected" : ""}`}
                    onClick={() => {
                      setPAddons((prev) => {
                        const has = prev.includes(a.name);
                        if (has) {
                          setPAddonTotal((t) => t - a.price);
                          return prev.filter((x) => x !== a.name);
                        }
                        setPAddonTotal((t) => t + a.price);
                        return [...prev, a.name];
                      });
                    }}
                  >
                    <div className="bf5-ol">
                      {a.icon} {a.short}
                    </div>
                    <div className="bf5-op">+${a.price}</div>
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <button
            type="button"
            className="bf5-btn-next"
            style={{ width: "100%", marginTop: 8 }}
            onClick={confirmClient}
          >
            Confirm ✓
          </button>
        </div>
      </div>
    </div>
  );
}
