/**
 * Static customer booking — same staff queue logic as Next /book
 */
(function (global) {
  const OPEN_HOUR = 10;
  const CLOSE_HOUR = 20;
  const SLOT_INTERVAL_MINS = 30;

  /** Populated from Supabase — do not hardcode services here */
  const LIVE_SERVICES = [];

  const FALLBACK_STAFF = [
    { name: "Pam", full_name: "Pamrin Suksong", status: "on", sort_order: 1 },
    { name: "Noon", full_name: "Nuchnat Meesuk", status: "on", sort_order: 2 },
    { name: "Min", full_name: "Minta Dee-ngam", status: "on", sort_order: 3 },
    { name: "Jane", full_name: "Jennifer Thongdee", status: "on", sort_order: 4 },
  ];

  const FALLBACK_ADDONS = [
    { name: "Aromatherapy", price: 12 },
    { name: "Hot Stones", price: 25 },
    { name: "Thai Herbs", price: 18 },
    { name: "Body Scrub", price: 28 },
    { name: "Vitamin C Mask", price: 15 },
    { name: "Eye Treatment", price: 10 },
  ];

  function todayISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  function calcWeekDay(dateStr) {
    const d = new Date(`${dateStr}T00:00:00`);
    const day = d.getDay();
    return day === 0 ? 6 : day - 1;
  }

  function formatMoney(amount) {
    return `$${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  }

  function getServiceIcon(name) {
    const n = String(name || "").toLowerCase();
    if (n.includes("thai")) return "🙏";
    if (n.includes("oil")) return "🫧";
    if (n.includes("spa")) return "🌸";
    if (n.includes("facial")) return "✨";
    if (n.includes("couple")) return "💑";
    if (n.includes("head")) return "💆";
    if (n.includes("hair")) return "✂️";
    return "💆";
  }

  function dedupeServicesById(list) {
    const byId = list.filter(
      (s, i, arr) => !s.id || arr.findIndex((x) => x.id === s.id) === i,
    );
    return byId.filter(
      (s, i, arr) =>
        arr.findIndex(
          (x) =>
            (s.id && x.id === s.id) ||
            String(x.name || "").toLowerCase() ===
              String(s.name || "").toLowerCase(),
        ) === i,
    );
  }

  function mapRowToLiveService(row) {
    const name = row.name || "";
    const duration = Number(row.duration) || 60;
    const price = Number(row.price) || 0;
    const type = row.type || "single";
    return {
      id: row.id,
      name,
      icon: getServiceIcon(name),
      nameTh: name,
      nameZh: name,
      nameEs: name,
      price,
      duration,
      type,
      couple: type === "couple",
      durations: [{ min: duration, price }],
    };
  }

  function esc(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;");
  }

  function parseWorkDays(raw) {
    if (raw == null) return [0, 1, 2, 3, 4, 5, 6];
    if (Array.isArray(raw)) return raw.map(Number);
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [0, 1, 2, 3, 4, 5, 6];
      } catch {
        return [0, 1, 2, 3, 4, 5, 6];
      }
    }
    return [0, 1, 2, 3, 4, 5, 6];
  }

  function resolveStaffAuthRole(row) {
    const auth = String(row.auth_role || "")
      .toLowerCase()
      .trim();
    if (auth) return auth;
    const role = String(row.role || "")
      .toLowerCase()
      .trim();
    if (
      ["owner", "manager", "reception", "receptionist", "staff", "ss_team"].includes(
        role,
      )
    ) {
      return role === "receptionist" ? "reception" : role;
    }
    return "staff";
  }

  function bookingStartMins(b) {
    return b.h * 60 + b.m;
  }

  function bookingEndMins(b) {
    return bookingStartMins(b) + b.dur;
  }

  function bookingsOverlap(a, b) {
    if (a.bookingDate !== b.bookingDate) return false;
    if (a.col !== b.col) return false;
    return (
      bookingStartMins(a) < bookingEndMins(b) &&
      bookingStartMins(b) < bookingEndMins(a)
    );
  }

  function hasBookingConflict(candidate, existing) {
    return existing.some((b) => bookingsOverlap(candidate, b));
  }

  function buildTimeSlots(duration) {
    const slots = [];
    const latestStart = CLOSE_HOUR * 60 - duration;
    for (let mins = OPEN_HOUR * 60; mins <= latestStart; mins += SLOT_INTERVAL_MINS) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      slots.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
      );
    }
    return slots;
  }

  function checkStaffBusy(staff, bookingDate, time, duration, existing, staffList) {
    const [h, m] = time.split(":").map(Number);
    const col = staffList.findIndex((s) => s.name === staff.name) + 1;
    if (col < 1) return true;

    const candidate = { bookingDate, h, m, dur: duration, col };
    if (hasBookingConflict(candidate, existing)) return true;

    return existing.some((b) => {
      if (b.bookingDate !== bookingDate || b.staff !== staff.name) return false;
      const other = {
        bookingDate: b.bookingDate,
        h: b.h,
        m: b.m,
        dur: b.dur,
        col: b.col,
      };
      return bookingsOverlap(candidate, other);
    });
  }

  function getNextAvailableStaff(
    bookingDate,
    time,
    duration,
    staffList,
    existing,
  ) {
    const workingStaff = [...staffList]
      .filter((s) => s.status === "on")
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    for (const staff of workingStaff) {
      if (
        !checkStaffBusy(staff, bookingDate, time, duration, existing, staffList)
      ) {
        return staff;
      }
    }
    return null;
  }

  function findAvailableColumn(
    bookingDate,
    time,
    duration,
    staffList,
    existing,
    preferredStaff,
  ) {
    if (preferredStaff) {
      const preferred = staffList.find(
        (s) => s.name === preferredStaff && s.status === "on",
      );
      if (
        preferred &&
        !checkStaffBusy(
          preferred,
          bookingDate,
          time,
          duration,
          existing,
          staffList,
        )
      ) {
        const col = staffList.findIndex((s) => s.name === preferred.name) + 1;
        if (col >= 1) return { col, staff: preferred.name };
      }
    }

    const next = getNextAvailableStaff(
      bookingDate,
      time,
      duration,
      staffList,
      existing,
    );
    if (!next) return null;

    const col = staffList.findIndex((s) => s.name === next.name) + 1;
    if (col < 1) return null;
    return { col, staff: next.name };
  }

  function getSuggestedStaff(state) {
    if (!state.selectedService || !state.time) return null;
    const preferred =
      state.requestStaff && state.staffName ? state.staffName : "";
    if (preferred) {
      return (
        state.staff.find((s) => s.name === preferred && s.status === "on") ||
        null
      );
    }
    return getNextAvailableStaff(
      state.bookingDate,
      state.time,
      state.selectedService.duration,
      state.staff,
      state.bookedSlots,
    );
  }

  async function loadSchedulesForDate(sb, bookingDate) {
    const map = {};
    try {
      const { data, error } = await sb
        .from("staff_schedules")
        .select("staff_id,status")
        .eq("schedule_date", bookingDate);
      if (error) return map;
      (data || []).forEach((row) => {
        if (row.staff_id) map[row.staff_id] = row.status;
      });
    } catch {
      /* table may not exist */
    }
    return map;
  }

  function statusForDate(row, schedules, bookingDate) {
    if (schedules[row.id]) {
      return schedules[row.id] === "on" ? "on" : "off";
    }
    const workDays = parseWorkDays(row.work_days);
    const weekDay = calcWeekDay(bookingDate);
    return workDays.includes(weekDay) ? "on" : "off";
  }

  async function fetchServicesRows(sb) {
    let result = await sb
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (result.error && /active/i.test(result.error.message || "")) {
      result = await sb
        .from("services")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true });
      if (result.data) {
        result.data = result.data.filter((row) => row.active !== false);
      }
    }

    return result;
  }

  async function loadStaffForDate(sb, bookingDate) {
    const { data, error } = await sb
      .from("staff")
      .select(
        "id,name,full_name,status,show_in_booking,auth_role,role,sort_order,work_days",
      )
      .order("sort_order", { ascending: true });

    if (error || !data?.length) {
      return FALLBACK_STAFF.filter((s) => s.status === "on");
    }

    const schedules = await loadSchedulesForDate(sb, bookingDate);

    return data
      .filter((row) => resolveStaffAuthRole(row) === "staff")
      .filter((row) => row.show_in_booking !== false)
      .map((row) => ({
        id: row.id,
        name: row.name,
        full_name: row.full_name || row.name,
        status: statusForDate(row, schedules, bookingDate),
        sort_order: Number(row.sort_order) || 0,
      }))
      .filter((row) => row.status === "on")
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  async function loadAddons(sb) {
    const { data, error } = await sb
      .from("addons")
      .select("id,name,price")
      .order("sort_order", { ascending: true });
    if (error || !data?.length) return FALLBACK_ADDONS;
    return data.map((row) => ({
      id: row.id,
      name: row.name,
      price: Number(row.price),
    }));
  }

  async function loadBookingsForDate(sb, bookingDate) {
    const { data, error } = await sb
      .from("bookings")
      .select("id,booking_date,h,m,dur,staff_col,staff")
      .eq("booking_date", bookingDate);
    if (error || !data) return [];
    return data.map((row) => ({
      id: row.id,
      bookingDate: row.booking_date,
      h: Number(row.h),
      m: Number(row.m),
      dur: Number(row.dur),
      col: Number(row.staff_col) || 1,
      staff: row.staff || "",
    }));
  }

  function stripMissingColumn(payload, message) {
    const colMatch = message.match(/Could not find the '(\w+)' column/i);
    if (!colMatch) return false;
    const col = colMatch[1];
    if (!Object.prototype.hasOwnProperty.call(payload, col)) return false;
    delete payload[col];
    return true;
  }

  async function insertBookingRow(sb, row) {
    let payload = { ...row };
    for (let attempt = 0; attempt < 20; attempt++) {
      const { error } = await sb.from("bookings").insert(payload);
      if (!error) return;
      if (stripMissingColumn(payload, error.message || "")) continue;
      throw error;
    }
    throw new Error("Schema mismatch — check bookings table columns");
  }

  async function createCustomerBooking(sb, input, assignment) {
    const [h, m] = input.time.split(":").map(Number);
    const addonNames = input.addons.map((a) => a.name).join(", ");
    const row = {
      booking_date: input.bookingDate,
      h,
      m,
      dur: input.service.duration,
      fname: input.fname,
      lname: input.lname,
      phone: input.phone,
      name: `${input.fname}${input.lname ? ` ${input.lname}` : ""}`.trim(),
      svc: input.service.name,
      staff_col: assignment.col,
      status: "pending",
      req: input.requestStaff && !!input.staffName,
      addon: addonNames,
      staff: assignment.staff,
      room: "",
      intime: "",
      outtime: "",
      week_day: calcWeekDay(input.bookingDate),
      notes: input.notes,
      client_id: 0,
      discount: 0,
      tip: 0,
      payment_method: "",
    };
    await insertBookingRow(sb, row);
  }

  async function createSupabaseClient() {
    const res = await fetch("/api/supabase-config");
    if (!res.ok) throw new Error("Supabase config unavailable");
    const { url, anonKey } = await res.json();
    if (!url || !anonKey) throw new Error("Missing Supabase env vars");
    return global.supabase.createClient(url, anonKey);
  }

  const CustomerBooking = {
    sb: null,
    channel: null,
    servicesChannel: null,
    servicesRealtimeReady: false,
    loading: true,
    submitting: false,
    error: "",
    success: false,
    step: 1,
    services: [],
    staff: [],
    addons: [],
    selectedService: null,
    bookingDate: todayISO(),
    time: "",
    selectedAddons: [],
    staffName: "",
    requestStaff: false,
    fname: "",
    lname: "",
    phone: "",
    notes: "",
    bookedSlots: [],

    async init() {
      const root = document.getElementById("cb-root");
      if (!root) return;
      try {
        this.sb = await createSupabaseClient();
        await this.loadServicesFromDB();
        this.setupServicesRealtime();
        await this.reloadCatalog();
        await this.refreshBookings();
        this.subscribeRealtime();
        this.loading = false;
        this.render();
      } catch (e) {
        console.error(e);
        this.loading = false;
        this.error =
          "ไม่สามารถโหลดข้อมูลได้ กรุณารีเฟรชหน้า หรือเปิด /book";
        this.render();
      }
    },

    async loadServicesFromDB() {
      if (!this.sb) return;
      const { data, error } = await fetchServicesRows(this.sb);
      if (error) {
        console.error("loadServicesFromDB:", error);
        return;
      }
      if (!data) return;

      LIVE_SERVICES.length = 0;
      data.forEach((row) => {
        LIVE_SERVICES.push(mapRowToLiveService(row));
      });

      const unique = dedupeServicesById(LIVE_SERVICES);
      LIVE_SERVICES.length = 0;
      unique.forEach((s) => LIVE_SERVICES.push(s));

      this.services = unique;

      if (this.selectedService?.id) {
        this.selectedService =
          this.services.find((s) => s.id === this.selectedService.id) || null;
      } else if (this.selectedService?.name) {
        this.selectedService =
          this.services.find((s) => s.name === this.selectedService.name) ||
          null;
      }

      this.renderSvc();
    },

    renderSvc() {
      if (!this.loading) this.render();
    },

    setupServicesRealtime() {
      if (!this.sb || this.servicesRealtimeReady) return;
      this.servicesRealtimeReady = true;
      this.servicesChannel = this.sb
        .channel("services-booking-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "services" },
          () => {
            this.loadServicesFromDB();
          },
        )
        .subscribe();
    },

    async reloadCatalog() {
      const [add, stf] = await Promise.all([
        loadAddons(this.sb),
        loadStaffForDate(this.sb, this.bookingDate),
      ]);
      this.addons = add;
      this.staff = stf;
    },

    async refreshBookings() {
      if (!this.sb || !this.bookingDate) return;
      this.bookedSlots = await loadBookingsForDate(this.sb, this.bookingDate);
    },

    subscribeRealtime() {
      if (!this.sb || this.channel) return;
      this.channel = this.sb
        .channel("book-static-live")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "staff" },
          () => this.onStaffOrScheduleChange(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "staff_schedules" },
          () => this.onStaffOrScheduleChange(),
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "bookings" },
          () => this.onBookingsChange(),
        )
        .subscribe();
    },

    async onStaffOrScheduleChange() {
      try {
        this.staff = await loadStaffForDate(this.sb, this.bookingDate);
        this.render();
      } catch (e) {
        console.error(e);
      }
    },

    async onBookingsChange() {
      await this.refreshBookings();
      this.render();
    },

    getAvailableTimes() {
      if (!this.selectedService) return [];
      const slots = buildTimeSlots(this.selectedService.duration);
      const preferred =
        this.requestStaff && this.staffName ? this.staffName : undefined;
      return slots.filter((slot) =>
        findAvailableColumn(
          this.bookingDate,
          slot,
          this.selectedService.duration,
          this.staff,
          this.bookedSlots,
          preferred,
        ),
      );
    },

    getTotalPrice() {
      if (!this.selectedService) return 0;
      return (
        this.selectedService.price +
        this.selectedAddons.reduce((sum, a) => sum + a.price, 0)
      );
    },

    toggleAddon(name) {
      const addon = this.addons.find((a) => a.name === name);
      if (!addon) return;
      const idx = this.selectedAddons.findIndex((a) => a.name === name);
      if (idx >= 0) this.selectedAddons.splice(idx, 1);
      else this.selectedAddons.push(addon);
      this.render();
    },

    async setBookingDate(val) {
      this.bookingDate = val;
      this.time = "";
      this.staff = await loadStaffForDate(this.sb, this.bookingDate);
      await this.refreshBookings();
      this.render();
    },

    async submit() {
      if (!this.selectedService || !this.time || !this.sb) return;
      this.submitting = true;
      this.error = "";
      this.render();

      try {
        const preferred =
          this.requestStaff && this.staffName ? this.staffName : undefined;
        const assignment = findAvailableColumn(
          this.bookingDate,
          this.time,
          this.selectedService.duration,
          this.staff,
          this.bookedSlots,
          preferred,
        );
        if (!assignment) {
          this.error = "ช่วงเวลานี้ไม่ว่างแล้ว กรุณาเลือกเวลาอื่น";
          this.submitting = false;
          this.render();
          return;
        }

        await createCustomerBooking(
          this.sb,
          {
            service: this.selectedService,
            bookingDate: this.bookingDate,
            time: this.time,
            fname: this.fname.trim(),
            lname: this.lname.trim(),
            phone: this.phone.trim(),
            notes: this.notes.trim(),
            staffName: this.staffName,
            requestStaff: this.requestStaff,
            addons: this.selectedAddons,
          },
          assignment,
        );

        this.success = true;
      } catch (e) {
        console.error(e);
        this.error =
          e instanceof Error ? e.message : "บันทึกการจองไม่สำเร็จ กรุณาลองใหม่";
      } finally {
        this.submitting = false;
        this.render();
      }
    },

    reset() {
      this.success = false;
      this.error = "";
      this.step = 1;
      this.selectedService = null;
      this.bookingDate = todayISO();
      this.time = "";
      this.selectedAddons = [];
      this.staffName = "";
      this.requestStaff = false;
      this.fname = "";
      this.lname = "";
      this.phone = "";
      this.notes = "";
      this.reloadCatalog().then(() => {
        this.refreshBookings().then(() => this.render());
      });
    },

    render() {
      const root = document.getElementById("cb-root");
      if (!root) return;

      if (this.loading) {
        root.innerHTML =
          '<div class="cb-loading"><p>กำลังโหลด...</p></div>';
        return;
      }

      if (this.success) {
        const svc = this.selectedService;
        root.innerHTML = `
          <div class="cb-success">
            <div class="cb-success-icon">✓</div>
            <h1>จองสำเร็จ!</h1>
            <p>เราได้รับคำขอจองของคุณแล้ว ทีมงานจะติดต่อกลับเพื่อยืนยัน</p>
            ${
              svc
                ? `<div class="cb-summary">
              <p><span>บริการ:</span> ${esc(svc.name)}</p>
              <p><span>วันที่:</span> ${esc(this.bookingDate)} ${esc(this.time)}</p>
              <p><span>ราคาโดยประมาณ:</span> ${formatMoney(this.getTotalPrice())}</p>
            </div>`
                : ""
            }
            <button type="button" class="cb-btn cb-btn-primary cb-btn-block" data-action="reset">จองอีกครั้ง</button>
          </div>`;
        root.querySelector('[data-action="reset"]')?.addEventListener("click", () =>
          this.reset(),
        );
        return;
      }

      const err = this.error
        ? `<div class="cb-alert">${esc(this.error)}</div>`
        : "";
      const suggested = getSuggestedStaff(this);
      const suggestedHtml =
        this.step === 2 && this.selectedService && this.time
          ? `<div class="cb-staff-hint">
              <span class="cb-staff-label">พนักงานที่ว่าง (ลำดับคิว): </span>
              ${
                suggested
                  ? `<span class="cb-staff-name">${esc(suggested.name)}</span>`
                  : '<span class="cb-staff-none">No staff available</span>'
              }
            </div>`
          : "";

      let body = "";
      if (this.step === 1) {
        body = `
          <section>
            <h2>เลือกบริการ</h2>
            <p class="cb-sub">เลือกทรีทเมนต์ที่ต้องการ</p>
            <div class="cb-grid">${
              this.services.length
                ? this.services
                    .map((s) => {
                      const sel =
                        this.selectedService &&
                        ((this.selectedService.id &&
                          this.selectedService.id === s.id) ||
                          this.selectedService.name === s.name);
                      const dur = s.duration || s.durations?.[0]?.min || 60;
                      const price = s.price ?? s.durations?.[0]?.price ?? 0;
                      return `<button type="button" class="cb-card ${sel ? "sel" : ""}" data-svc-id="${esc(s.id || "")}" data-svc="${esc(s.name)}">
                  <div class="cb-card-title"><span class="cb-svc-icon" aria-hidden="true">${s.icon || getServiceIcon(s.name)}</span> ${esc(s.name)}</div>
                  <div class="cb-card-meta"><span>${dur} นาที</span><span class="cb-price">${formatMoney(price)}</span></div>
                </button>`;
                    })
                    .join("")
                : '<p class="cb-muted">ไม่มีบริการในขณะนี้</p>'
            }</div>
            <div class="cb-actions end">
              <button type="button" class="cb-btn cb-btn-primary" data-action="next1" ${this.selectedService ? "" : "disabled"}>ถัดไป</button>
            </div>
          </section>`;
      } else if (this.step === 2 && this.selectedService) {
        const times = this.getAvailableTimes();
        body = `
          <section>
            <h2>เลือกวันและเวลา</h2>
            <p class="cb-sub">${esc(this.selectedService.name)} · ${this.selectedService.duration} นาที</p>
            <label class="cb-field">วันที่
              <input type="date" id="cb-date" value="${esc(this.bookingDate)}" min="${todayISO()}">
            </label>
            ${suggestedHtml}
            <p class="cb-field-label">เวลาที่ว่าง</p>
            ${
              times.length === 0
                ? '<p class="cb-muted">ไม่มีช่วงเวลาว่างในวันนี้ ลองเปลี่ยนวันที่</p>'
                : `<div class="cb-times">${times
                    .map(
                      (slot) =>
                        `<button type="button" class="cb-time ${this.time === slot ? "sel" : ""}" data-time="${slot}">${slot}</button>`,
                    )
                    .join("")}</div>`
            }
            <div class="cb-actions">
              <button type="button" class="cb-btn cb-btn-ghost" data-action="back2">ย้อนกลับ</button>
              <button type="button" class="cb-btn cb-btn-primary" data-action="next2" ${this.time ? "" : "disabled"}>ถัดไป</button>
            </div>
          </section>`;
      } else if (this.step === 3 && this.selectedService) {
        body = `
          <section>
            <h2>ตัวเลือกเพิ่มเติม</h2>
            <p class="cb-sub">ไม่บังคับ</p>
            <label class="cb-check">
              <input type="checkbox" id="cb-req-staff" ${this.requestStaff ? "checked" : ""}>
              ต้องการระบุพนักงาน
            </label>
            ${
              this.requestStaff
                ? `<select id="cb-staff-pick" class="cb-select">
                <option value="">เลือกพนักงาน</option>
                ${this.staff
                  .map((s) => {
                    const label =
                      s.full_name && s.full_name !== s.name
                        ? `${s.name} (${s.full_name})`
                        : s.name;
                    return `<option value="${esc(s.name)}" ${this.staffName === s.name ? "selected" : ""}>${esc(label)}</option>`;
                  })
                  .join("")}
              </select>`
                : ""
            }
            <p class="cb-field-label">Add-on</p>
            <div class="cb-chips">${this.addons
              .map((a) => {
                const on = this.selectedAddons.some((x) => x.name === a.name);
                return `<button type="button" class="cb-chip ${on ? "on" : ""}" data-addon="${esc(a.name)}">${esc(a.name)} +${formatMoney(a.price)}</button>`;
              })
              .join("")}</div>
            <div class="cb-total"><span>ราคารวมโดยประมาณ</span><span class="cb-price">${formatMoney(this.getTotalPrice())}</span></div>
            <div class="cb-actions">
              <button type="button" class="cb-btn cb-btn-ghost" data-action="back3">ย้อนกลับ</button>
              <button type="button" class="cb-btn cb-btn-primary" data-action="next3">ถัดไป</button>
            </div>
          </section>`;
      } else if (this.step === 4 && this.selectedService) {
        body = `
          <section>
            <h2>ข้อมูลติดต่อ</h2>
            <p class="cb-sub">กรอกชื่อและเบอร์โทรเพื่อยืนยันการจอง</p>
            <div class="cb-row">
              <label class="cb-field">ชื่อ *
                <input type="text" id="cb-fname" value="${esc(this.fname)}" placeholder="ชื่อ">
              </label>
              <label class="cb-field">นามสกุล
                <input type="text" id="cb-lname" value="${esc(this.lname)}" placeholder="นามสกุล">
              </label>
            </div>
            <label class="cb-field">เบอร์โทร *
              <input type="tel" id="cb-phone" value="${esc(this.phone)}" placeholder="08x-xxx-xxxx">
            </label>
            <label class="cb-field">หมายเหตุ
              <textarea id="cb-notes" rows="3" placeholder="แจ้งความต้องการพิเศษ (ถ้ามี)">${esc(this.notes)}</textarea>
            </label>
            <div class="cb-review">
              <p class="cb-review-title">สรุปการจอง</p>
              <p>${esc(this.selectedService.name)}</p>
              <p>${esc(this.bookingDate)} · ${esc(this.time)} · ${formatMoney(this.getTotalPrice())}</p>
            </div>
            <div class="cb-actions">
              <button type="button" class="cb-btn cb-btn-ghost" data-action="back4">ย้อนกลับ</button>
              <button type="button" class="cb-btn cb-btn-primary" data-action="submit" ${this.submitting || !this.fname.trim() || !this.phone.trim() ? "disabled" : ""}>${this.submitting ? "กำลังบันทึก..." : "ยืนยันการจอง"}</button>
            </div>
          </section>`;
      }

      root.innerHTML = `
        <header class="cb-header">
          <div class="cb-brand">
            <img src="/assets/sunshine-logo.png" alt="Sunshine" class="cb-logo">
            <div>
              <p class="cb-brand-title">จองคิวออนไลน์</p>
              <p class="cb-brand-sub">Sunshine Spa &amp; Salon</p>
            </div>
          </div>
          <span class="cb-step-badge">ขั้นตอน ${this.step}/4</span>
        </header>
        <main class="cb-main">${err}${body}</main>`;

      this.bindEvents(root);
    },

    bindEvents(root) {
      root.querySelectorAll("[data-svc]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-svc-id");
          const name = btn.getAttribute("data-svc");
          this.selectedService =
            this.services.find(
              (s) => (id && s.id === id) || s.name === name,
            ) || null;
          this.render();
        });
      });

      root.querySelector('[data-action="next1"]')?.addEventListener("click", () => {
        if (this.selectedService) {
          this.step = 2;
          this.render();
        }
      });

      const dateEl = root.querySelector("#cb-date");
      dateEl?.addEventListener("change", (e) => {
        this.setBookingDate(e.target.value);
      });

      root.querySelectorAll("[data-time]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.time = btn.getAttribute("data-time") || "";
          this.render();
        });
      });

      root.querySelector('[data-action="back2"]')?.addEventListener("click", () => {
        this.step = 1;
        this.render();
      });
      root.querySelector('[data-action="next2"]')?.addEventListener("click", () => {
        if (this.time) {
          this.step = 3;
          this.render();
        }
      });

      root.querySelector("#cb-req-staff")?.addEventListener("change", (e) => {
        this.requestStaff = e.target.checked;
        if (!this.requestStaff) this.staffName = "";
        this.render();
      });
      root.querySelector("#cb-staff-pick")?.addEventListener("change", (e) => {
        this.staffName = e.target.value;
        this.render();
      });

      root.querySelectorAll("[data-addon]").forEach((btn) => {
        btn.addEventListener("click", () => {
          this.toggleAddon(btn.getAttribute("data-addon"));
        });
      });

      root.querySelector('[data-action="back3"]')?.addEventListener("click", () => {
        this.step = 2;
        this.render();
      });
      root.querySelector('[data-action="next3"]')?.addEventListener("click", () => {
        this.step = 4;
        this.render();
      });

      const submitBtn = root.querySelector('[data-action="submit"]');
      const syncSubmitDisabled = () => {
        if (submitBtn) {
          submitBtn.disabled =
            this.submitting || !this.fname.trim() || !this.phone.trim();
        }
      };
      root.querySelector("#cb-fname")?.addEventListener("input", (e) => {
        this.fname = e.target.value;
        syncSubmitDisabled();
      });
      root.querySelector("#cb-lname")?.addEventListener("input", (e) => {
        this.lname = e.target.value;
      });
      root.querySelector("#cb-phone")?.addEventListener("input", (e) => {
        this.phone = e.target.value;
        syncSubmitDisabled();
      });
      root.querySelector("#cb-notes")?.addEventListener("input", (e) => {
        this.notes = e.target.value;
      });

      root.querySelector('[data-action="back4"]')?.addEventListener("click", () => {
        this.step = 3;
        this.render();
      });
      root.querySelector('[data-action="submit"]')?.addEventListener("click", () => {
        this.fname = root.querySelector("#cb-fname")?.value || this.fname;
        this.lname = root.querySelector("#cb-lname")?.value || this.lname;
        this.phone = root.querySelector("#cb-phone")?.value || this.phone;
        this.notes = root.querySelector("#cb-notes")?.value || this.notes;
        this.submit();
      });
    },
  };

  global.CustomerBooking = CustomerBooking;
  global.LIVE_SERVICES = LIVE_SERVICES;
})(window);
