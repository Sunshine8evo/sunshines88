/* Shared staff roster — load from Supabase, sync order across pages */

const STAFF_SYNC_KEY = 'sunshine_staff_order_v3';
const STAFF_SYNC_EVENT = 'sunshine-staff-updated';

const DEFAULT_STAFF_CALENDAR = [
  {name:'Pam',full:'Pamrin Suksong',role:'Massage Therapist',color:'#fdf0f3',tc:'#8a1a30',status:'on',show_in_booking:true,sort_order:1,auth_role:'staff'},
  {name:'Noon',full:'Nuchnat Meesuk',role:'Spa Therapist',color:'#eaf3fc',tc:'#0c447c',status:'on',show_in_booking:true,sort_order:2,auth_role:'staff'},
  {name:'Min',full:'Minta Dee-ngam',role:'Hair Stylist',color:'#eaf6ef',tc:'#185a32',status:'on',show_in_booking:true,sort_order:3,auth_role:'staff'},
  {name:'Jane',full:'Jennifer Thongdee',role:'Massage Therapist',color:'#fdf6e7',tc:'#7d5a00',status:'on',show_in_booking:true,sort_order:4,auth_role:'staff'},
  {name:'Bo',full:'Bo Suayngam',role:'Head Spa',color:'#f4f0fe',tc:'#3c3489',status:'leave',show_in_booking:true,sort_order:5,auth_role:'staff'},
];

let STAFF_DATA = DEFAULT_STAFF_CALENDAR.map(s => ({...s}));

function normalizeStaffStatus(raw) {
  const v = String(raw || 'on').toLowerCase();
  if (v === 'on' || v === 'active' || v === 'ready') return 'on';
  return 'leave';
}

const STAFF_POSITION_TIERS = ['manager', 'receptionist', 'staff'];

const SYSTEM_AVATAR_PRESETS = [
  { id: 'rose', bg: '#fdf0f3', fg: '#8a1a30' },
  { id: 'blue', bg: '#eaf3fc', fg: '#0c447c' },
  { id: 'green', bg: '#eaf6ef', fg: '#185a32' },
  { id: 'gold', bg: '#fdf6e7', fg: '#7d5a00' },
  { id: 'violet', bg: '#f4f0fe', fg: '#3c3489' },
  { id: 'peach', bg: '#fff0eb', fg: '#9a3412' },
  { id: 'mint', bg: '#ecfdf5', fg: '#065f46' },
  { id: 'slate', bg: '#f1f5f9', fg: '#334155' },
];

function escStaffHtml(v) {
  return String(v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;');
}

function staffAvatarHtml(s, sizeClass) {
  const extra = sizeClass ? ` ${sizeClass}` : '';
  const url = String(s?.avatar_url || '').trim();
  if (url && !url.startsWith('system:')) {
    return `<img class="staff-avatar-img${extra}" src="${escStaffHtml(url)}" alt="" loading="lazy">`;
  }
  const presetId = url.startsWith('system:') ? url.slice(7) : '';
  const preset = SYSTEM_AVATAR_PRESETS.find((p) => p.id === presetId);
  const bg = preset?.bg || s?.color || '#fdf0f3';
  const fg = preset?.fg || s?.tc || s?.text_color || '#8a1a30';
  const initial = (s?.name || '?')[0].toUpperCase();
  return `<div class="staff-avatar-img staff-avatar-initial${extra}" style="background:${bg};color:${fg}">${initial}</div>`;
}

function renderCalendarStaffHeaderHtml(s) {
  return `<div class="sch-hcell sch-hcell-staff">${staffAvatarHtml(s, 'sch-staff-avatar')}` +
    `<span class="sch-staff-name">${escStaffHtml(s.name)}</span></div>`;
}

function staffPositionLabel(tier) {
  const labels = {
    manager: 'Manager',
    receptionist: 'Receptionist',
    staff: 'Staff',
  };
  return labels[tier] || 'Staff';
}

function resolveStaffAuthRole(s) {
  const auth = String(s?.auth_role || '').toLowerCase().trim();
  if (auth) return auth;
  const role = String(s?.role || '').toLowerCase().trim();
  if (['owner', 'manager', 'reception', 'receptionist', 'staff', 'ss_team'].includes(role)) return role;
  return 'staff';
}

function resolveStaffPosition(s) {
  const pos = String(s?.staff_position || '').toLowerCase().trim();
  if (STAFF_POSITION_TIERS.includes(pos)) return pos;
  const auth = resolveStaffAuthRole(s);
  if (auth === 'manager') return 'manager';
  if (auth === 'reception' || auth === 'receptionist') return 'receptionist';
  return 'staff';
}

function isCalendarScheduleStaff(s) {
  return resolveStaffAuthRole(s) === 'staff' && resolveStaffPosition(s) === 'staff';
}

function getCalendarScheduleStaff() {
  return STAFF_DATA.filter(isCalendarScheduleStaff);
}

function isStaffBookable(s) {
  return isCalendarScheduleStaff(s) &&
    normalizeStaffStatus(s.status) === 'on' &&
    s.show_in_booking !== false;
}

function parseJsonField(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === 'object') return v;
  try { return JSON.parse(v); } catch { return fallback; }
}

function staffRowToCalendar(r) {
  return {
    id: r.id,
    name: r.name || '',
    full: r.full_name || r.name || '',
    role: r.position || r.role || '',
    color: r.color || '#fdf0f3',
    tc: r.text_color || '#8a1a30',
    status: normalizeStaffStatus(r.status),
    show_in_booking: r.show_in_booking !== false,
    sort_order: Number(r.sort_order) || 0,
    work_days: parseJsonField(r.work_days, [0, 1, 2, 3, 4, 5, 6]),
    work_hours: parseJsonField(r.work_hours, {start:'10:00', end:'21:00'}),
    services: parseJsonField(r.services, {}),
    pay_rates: parseJsonField(r.pay_rates, []),
    username: r.username || '',
    password: r.password || '',
    auth_role: resolveStaffAuthRole({auth_role: r.auth_role, role: r.role}),
    staff_position: resolveStaffPosition(r),
    position_name: r.position_name || '',
    avatar_url: r.avatar_url || '',
  };
}

function mapStaffRow(r) {
  const cal = staffRowToCalendar(r);
  return {
    id: cal.id,
    name: cal.name,
    full_name: cal.full,
    position: cal.role,
    color: cal.color,
    text_color: cal.tc,
    status: cal.status === 'on' ? 'on' : 'off',
    sort_order: cal.sort_order,
    show_in_booking: cal.show_in_booking,
    work_days: cal.work_days,
    work_hours: cal.work_hours,
    services: cal.services,
    pay_rates: cal.pay_rates,
    username: cal.username,
    password: cal.password,
    auth_role: cal.auth_role,
    staff_position: cal.staff_position,
    position_name: cal.position_name,
    avatar_url: cal.avatar_url || '',
  };
}

function calendarToSyncPayload(list) {
  return list.map(s => ({
    id: s.id,
    name: s.name,
    full: s.full || s.full_name,
    role: s.role || s.position,
    color: s.color,
    tc: s.tc || s.text_color,
    status: normalizeStaffStatus(s.status === 'off' ? 'leave' : s.status),
    show_in_booking: s.show_in_booking !== false,
    sort_order: s.sort_order || 0,
    auth_role: resolveStaffAuthRole(s),
    staff_position: resolveStaffPosition(s),
    position_name: s.position_name || '',
    avatar_url: s.avatar_url || '',
  }));
}

function cacheStaffOrder(list) {
  try {
    localStorage.setItem(STAFF_SYNC_KEY, JSON.stringify(calendarToSyncPayload(list)));
  } catch (e) { console.warn('cacheStaffOrder:', e); }
}

function applyCachedStaffOrder() {
  try {
    const raw = localStorage.getItem(STAFF_SYNC_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.length) return false;
    if (parsed.some(s => s.auth_role == null || s.auth_role === '')) return false;
    STAFF_DATA = parsed.map(s => ({
      ...s,
      full: s.full || s.name,
      role: s.role || '',
      tc: s.tc || '#8a1a30',
      status: normalizeStaffStatus(s.status),
      auth_role: resolveStaffAuthRole(s),
      staff_position: resolveStaffPosition(s),
      position_name: s.position_name || '',
      avatar_url: s.avatar_url || '',
    }));
    return true;
  } catch { return false; }
}

function broadcastStaffOrder(list) {
  const payload = calendarToSyncPayload(list);
  cacheStaffOrder(list);
  window.dispatchEvent(new CustomEvent(STAFF_SYNC_EVENT, {detail: payload}));
}

function getBookableStaff() {
  return STAFF_DATA.filter(isStaffBookable);
}

function applyStaffToIndexUI() {
  const bookingNames = getBookableStaff().map(s => s.name);
  const calendarNames = getCalendarScheduleStaff().map(s => s.name);
  const filterEl = document.getElementById('staff-filter');
  if (filterEl) {
    const prev = filterEl.value;
    const allLbl = typeof tr === 'function' ? tr('all_staff') : 'All Staff';
    filterEl.innerHTML = `<option value="">${allLbl}</option>` + calendarNames.map(n => `<option>${n}</option>`).join('');
    if (prev && [...filterEl.options].some(o => o.value === prev)) filterEl.value = prev;
  }
  if (typeof updateNbServiceLayout === 'function') updateNbServiceLayout();
  else if (typeof refreshNbStaffDropdowns === 'function') refreshNbStaffDropdowns();
  ['eb-staff', 'be-staff'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const prev = el.value;
    el.innerHTML = `<option value="">-- Select --</option>` + bookingNames.map(n => `<option>${n}</option>`).join('');
    if (prev && [...el.options].some(o => o.value === prev)) el.value = prev;
  });
  if (typeof renderSch === 'function') renderSch();
  if (typeof renderBoard === 'function') renderBoard();
  if (typeof renderStaff === 'function') renderStaff();
  if (typeof resyncAllBookingCols === 'function') {
    resyncAllBookingCols();
    if (typeof refreshBookingUI === 'function') refreshBookingUI();
  }
}

async function loadStaffData(sb) {
  if (!sb) {
    applyCachedStaffOrder();
    applyStaffToIndexUI();
    return STAFF_DATA;
  }
  let data, error;
  ({data, error} = await sb.from('staff').select('*').order('sort_order', {ascending: true}));
  if (error) {
    console.warn('loadStaffData sort_order:', error);
    ({data, error} = await sb.from('staff').select('*'));
  }
  if (error || !data?.length) {
    applyCachedStaffOrder();
    applyStaffToIndexUI();
    return STAFF_DATA;
  }
  STAFF_DATA = data.map(staffRowToCalendar).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  cacheStaffOrder(STAFF_DATA);
  applyStaffToIndexUI();
  return STAFF_DATA;
}

function buildQueueSidebar(getBookingsFn, fmtGuestNameFn, pad2Fn) {
  const today = typeof getBookingsFn === 'function' ? getBookingsFn() : [];
  return STAFF_DATA.map((s, i) => {
    const rows = today
      .filter(b => b.staff === s.name)
      .sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));
    const next = rows[0];
    const guest = next && typeof fmtGuestNameFn === 'function' ? fmtGuestNameFn(next) : (next?.name || '—');
    return {
      num: i + 1,
      name: s.name,
      next: next ? `${next.svc || 'Service'} — ${guest}` : '—',
      time: next ? `${pad2Fn(next.h)}:${pad2Fn(next.m)}` : '—',
    };
  });
}

function setupStaffSyncListener() {
  window.addEventListener(STAFF_SYNC_EVENT, e => {
    if (!e.detail?.length) return;
    STAFF_DATA = e.detail.map(s => ({
      ...s,
      full: s.full || s.name,
      role: s.role || '',
      tc: s.tc || '#8a1a30',
      status: normalizeStaffStatus(s.status),
      auth_role: resolveStaffAuthRole(s),
      staff_position: resolveStaffPosition(s),
      position_name: s.position_name || '',
      avatar_url: s.avatar_url || '',
    }));
    applyStaffToIndexUI();
  });
  window.addEventListener('storage', e => {
    if (e.key !== STAFF_SYNC_KEY) return;
    if (applyCachedStaffOrder()) applyStaffToIndexUI();
  });
}
