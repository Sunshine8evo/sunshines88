/* Settings: Services, Add-ons, Commission, Rooms — Supabase sync */

const DEFAULT_SVCS=[
  {name:'Thai Massage 60 min',price:65,duration:60,type:'single',sort_order:1},
  {name:'Oil Massage 90 min',price:95,duration:90,type:'single',sort_order:2},
  {name:'Spa Body Treatment',price:120,duration:90,type:'single',sort_order:3},
  {name:'Facial',price:85,duration:60,type:'single',sort_order:4},
  {name:'Couple Massage 90 min',price:160,duration:90,type:'couple',sort_order:5},
  {name:'Haircut',price:35,duration:45,type:'single',sort_order:6}
];
const DEFAULT_ADDONS=[
  {name:'Aromatherapy',price:12,sort_order:1},
  {name:'Hot Stones',price:25,sort_order:2},
  {name:'Thai Herbs',price:18,sort_order:3},
  {name:'Body Scrub',price:28,sort_order:4},
  {name:'Vitamin C Mask',price:15,sort_order:5},
  {name:'Eye Treatment',price:10,sort_order:6}
];
const DEFAULT_ROOMS=[
  {name:'Room 1',capacity:1,status:'active',sort_order:1},
  {name:'Room 2',capacity:1,status:'active',sort_order:2},
  {name:'Room 3',capacity:1,status:'active',sort_order:3},
  {name:'VIP Room',capacity:1,status:'active',sort_order:4},
  {name:'Couple Room',capacity:2,status:'active',sort_order:5},
  {name:'Group Room',capacity:2,status:'active',sort_order:6}
];

let servicesCatalog=[];
let addonsCatalog=[];
let roomsCatalog=[];
let commissionsCatalog=[];
let editingServiceId=null;
let editingAddonId=null;
let editingCommissionId=null;
let editingRoomId=null;
let catalogRealtimeReady=false;
let servicesRealtimeReady=false;
let addonsRealtimeReady=false;

function rowToService(r){
  return{id:r.id,name:r.name,price:Number(r.price),duration:Number(r.duration||60),type:r.type||'single'};
}
function svcDedupeKey(s){
  return String(s.name||'').toLowerCase();
}
function dedupeServicesById(list){
  const byId=list.filter((s,i,arr)=>s.id==null||arr.findIndex(x=>x.id===s.id)===i);
  return byId.filter((s,i,arr)=>arr.findIndex(x=>svcDedupeKey(x)===svcDedupeKey(s))===i);
}
function applyServicesCatalog(list){
  servicesCatalog=sortByName(dedupeServicesById(list));
  syncCatalogGlobals();
  renderServices();
}
function handleServiceRealtime(payload){
  const t=payload.eventType;
  if(t==='INSERT'&&payload.new){
    const row=rowToService(payload.new);
    if(!servicesCatalog.some(s=>s.id===row.id))servicesCatalog.push(row);
    applyServicesCatalog(servicesCatalog);
  }else if(t==='UPDATE'&&payload.new){
    const row=rowToService(payload.new);
    const i=servicesCatalog.findIndex(s=>s.id===row.id);
    if(i>=0)servicesCatalog[i]=row;
    else servicesCatalog.push(row);
    applyServicesCatalog(servicesCatalog);
  }else if(t==='DELETE'&&payload.old?.id){
    servicesCatalog=servicesCatalog.filter(s=>s.id!==payload.old.id);
    applyServicesCatalog(servicesCatalog);
  }
}
function setupServicesRealtime(){
  if(!sb||servicesRealtimeReady)return;
  servicesRealtimeReady=true;
  sb.channel('services-live')
    .on('postgres_changes',{event:'*',schema:'public',table:'services'},handleServiceRealtime)
    .subscribe();
}

function showAppToast(msg){
  const el=document.getElementById('app-toast');
  if(!el){alert(msg);return}
  el.textContent=msg;
  el.style.display='block';
  clearTimeout(showAppToast._hideTimer);
  showAppToast._hideTimer=setTimeout(()=>{el.style.display='none'},2500);
}

function rowToAddon(r){
  return{id:r.id,name:r.name,price:Number(r.price),service_id:r.service_id||null};
}
function addonDedupeKey(a){
  return`${String(a.name||'').toLowerCase()}|${a.service_id||''}`;
}
function dedupeAddonsById(list){
  const byId=list.filter((a,i,arr)=>a.id==null||arr.findIndex(x=>x.id===a.id)===i);
  return byId.filter((a,i,arr)=>arr.findIndex(x=>addonDedupeKey(x)===addonDedupeKey(a))===i);
}
function applyAddonsCatalog(list){
  addonsCatalog=sortByName(dedupeAddonsById(list));
  syncCatalogGlobals();
  renderAddonsList();
  if(typeof renderNbAddonSection==='function')renderNbAddonSection();
  else if(typeof renderModalAddon==='function')renderModalAddon();
}
function handleAddonRealtime(payload){
  const t=payload.eventType;
  if(t==='INSERT'&&payload.new){
    const row=rowToAddon(payload.new);
    if(!addonsCatalog.some(a=>a.id===row.id))addonsCatalog.push(row);
    applyAddonsCatalog(addonsCatalog);
  }else if(t==='UPDATE'&&payload.new){
    const row=rowToAddon(payload.new);
    const i=addonsCatalog.findIndex(a=>a.id===row.id);
    if(i>=0)addonsCatalog[i]=row;
    else addonsCatalog.push(row);
    applyAddonsCatalog(addonsCatalog);
  }else if(t==='DELETE'&&payload.old?.id){
    addonsCatalog=addonsCatalog.filter(a=>a.id!==payload.old.id);
    applyAddonsCatalog(addonsCatalog);
  }
}
function setupAddonsRealtime(){
  if(!sb||addonsRealtimeReady)return;
  addonsRealtimeReady=true;
  sb.channel('addons-live')
    .on('postgres_changes',{event:'*',schema:'public',table:'addons'},handleAddonRealtime)
    .subscribe();
}

let SVCS=[];
let ADDONS_DATA=[];
let ROOMS_DATA=[];

const STAFF_TARGET_OPTS=[
  {v:'manager',label:'Only Manager'},
  {v:'reception',label:'Only Receptionist'},
  {v:'staff',label:'Only Staffs'},
  {v:'all',label:'All Employees'}
];

function svcTypeLabel(type){
  if(type==='couple')return 'Couple (2 Staff)';
  if(type==='group')return 'Group';
  return 'Solo (1 Staff)';
}
function syncCatalogGlobals(){
  SVCS=servicesCatalog.map(s=>({
    id:s.id,name:s.name,price:String(s.price),dur:String(s.duration||60),
    type:s.type||'single',
    staff_capacity:Number(s.staff_capacity||s.staff_count||0)||(s.type==='group'?4:0)
  }));
  ADDONS_DATA=addonsCatalog.map(a=>({id:a.id,name:a.name,price:String(a.price),service_id:a.service_id||null}));
  ROOMS_DATA=roomsCatalog.filter(r=>r.status==='active').map(r=>r.name);
}

function renderServices(){
  const el=document.getElementById('svc-list');if(!el)return;
  const list=dedupeServicesById(servicesCatalog);
  el.innerHTML=list.length?list.map(s=>`
    <div class="svc-item">
      <div class="svc-name">${escHtml(s.name)}</div>
      <span class="badge ${s.type==='couple'?'b-blue':'b-gray'}">${svcTypeLabel(s.type)}</span>
      <div class="svc-price">${fmtMoney(s.price)}</div>
      <div class="svc-dur">${s.duration||60} min</div>
      <button class="btn btn-sm" type="button" onclick="openServiceModal('${s.id}')"><i class="ti ti-edit"></i></button>
    </div>`).join(''):`<div class="intake-empty">No services yet.</div>`;
  renderAddonsList();
  if(typeof renderModalAddon==='function')renderModalAddon();
  if(typeof populateNbSvcSelect==='function')populateNbSvcSelect();
}
function renderAddonsList(){
  const el=document.getElementById('addon-list');if(!el)return;
  const list=dedupeAddonsById(addonsCatalog);
  el.innerHTML=list.length?list.map(a=>{
    const svc=a.service_id?servicesCatalog.find(s=>s.id===a.service_id):null;
    const svcLbl=svc?`<span class="intake-type"> · ${escHtml(svc.name)}</span>`:'';
    return `<div class="svc-item">
      <div class="svc-name">${escHtml(a.name)}${svcLbl}</div>
      <div class="svc-price">+${fmtMoney(a.price)}</div>
      <button class="btn btn-sm" type="button" onclick="openAddonModal('${a.id}')"><i class="ti ti-edit"></i></button>
    </div>`;
  }).join(''):`<div class="intake-empty">No add-ons yet.</div>`;
}
const APPLY_TO_OPTS=[
  {v:'all',label:'All Service Types'},
  {v:'massage',label:'Massage Only'},
  {v:'facial',label:'Facial Only'},
  {v:'couple',label:'Couple Service'}
];

function rowToCommission(r){
  const method=r.method==='flat'?'flat':'percent';
  return{
    id:r.id,
    name:r.name||'',
    method,
    rate:Number(r.rate)||0,
    price:Number(r.price)||0,
    apply_to:r.apply_to||'all',
    staff_target:r.staff_target||'all'
  };
}

function commValueLabel(c){
  return c.method==='flat'?`$${c.price}/session`:`${c.rate}%`;
}

function renderCommissions(){
  const el=document.getElementById('commission-list');if(!el)return;
  el.innerHTML=commissionsCatalog.length?commissionsCatalog.map(c=>{
    const tgt=STAFF_TARGET_OPTS.find(o=>o.v===c.staff_target)?.label||c.staff_target;
    const scope=APPLY_TO_OPTS.find(o=>o.v===c.apply_to)?.label||c.apply_to;
    const methodBadge=c.method==='flat'
      ?`<span class="badge b-gray">$ Flat/session</span>`
      :`<span class="badge b-blue">% Revenue</span>`;
    return `<div class="svc-item">
      <div class="svc-name">${escHtml(c.name)}</div>
      ${methodBadge}
      <div class="svc-price">${escHtml(commValueLabel(c))}</div>
      <div class="svc-dur" style="flex:1;font-size:11px;color:var(--t2)">${escHtml(scope)} · ${escHtml(tgt)}</div>
      <button class="btn btn-sm" type="button" onclick="openCommissionModal('${c.id}')"><i class="ti ti-edit"></i></button>
    </div>`;
  }).join(''):`<div class="intake-empty">No commissions yet.</div>`;
}

// Returns the active commission config that best applies to a given role.
// Prefers a rule explicitly targeting the role over an 'all' rule.
function getActiveCommission(role){
  if(!commissionsCatalog.length)return null;
  const r=String(role||'').toLowerCase();
  const targeted=commissionsCatalog.find(c=>String(c.staff_target||'').toLowerCase()===r);
  if(targeted)return targeted;
  const all=commissionsCatalog.find(c=>String(c.staff_target||'').toLowerCase()==='all');
  return all||commissionsCatalog[0];
}
function renderRooms(){
  const el=document.getElementById('rooms-cards');if(!el)return;
  el.innerHTML=roomsCatalog.length?roomsCatalog.map(r=>`
    <div class="scard room-card" style="margin-bottom:0">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500;display:flex;align-items:center;gap:6px">
            <i class="ti ti-door" style="font-size:14px;color:var(--rose)"></i>${escHtml(r.name)}
          </div>
          <div style="font-size:11px;color:#888;margin-top:4px">${r.capacity||1} guest${(r.capacity||1)>1?'s':''}</div>
        </div>
        <span class="badge ${r.status==='active'?'b-green':'b-gray'} room-status-badge" style="cursor:pointer" onclick="toggleRoomStatus('${r.id}')" title="Toggle status">${r.status==='active'?'Active':'Inactive'}</span>
      </div>
      <div class="row-btns" style="margin-top:10px;justify-content:flex-end">
        <button class="btn btn-sm btn-ghost" type="button" onclick="removeRoom('${r.id}')"><i class="ti ti-trash"></i></button>
        <button class="btn btn-sm" type="button" onclick="openRoomModal('${r.id}')"><i class="ti ti-edit"></i></button>
      </div>
    </div>`).join(''):`<div class="intake-empty" style="grid-column:1/-1">No rooms yet.</div>`;
}
function escHtml(v){return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}

function openServiceModal(id){
  editingServiceId=id||null;
  const s=id?servicesCatalog.find(x=>x.id===id):null;
  document.getElementById('svc-modal-title').textContent=s?'Edit Service':'Add Service';
  document.getElementById('svc-name').value=s?.name||'';
  document.getElementById('svc-price').value=s?.price??'';
  document.getElementById('svc-dur').value=s?.duration??60;
  document.querySelector(`input[name=svctype][value="${s?.type==='couple'?'couple':'single'}"]`).checked=true;
  const rmBtn=document.getElementById('svc-remove-btn');
  if(rmBtn)rmBtn.style.display=id?'inline-flex':'none';
  openModal('addsvc');
}
async function saveServiceModal(){
  const name=document.getElementById('svc-name').value.trim();
  const price=Number(document.getElementById('svc-price').value)||0;
  const duration=Number(document.getElementById('svc-dur').value)||60;
  const type=document.querySelector('input[name=svctype]:checked')?.value||'single';
  if(!name){document.getElementById('svc-name').focus();return}
  const row={name,price,duration,type};
  const serviceId=editingServiceId;
  try{
    if(!sb){alert('Supabase not connected');return}
    if(serviceId){
      const {error}=await sb.from('services').update(row).eq('id',serviceId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('services').insert(row);
      if(error)throw error;
    }
    editingServiceId=null;
    closeModal('addsvc');
    showAppToast(serviceId?'Service saved':'Service added');
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelServiceModal(){editingServiceId=null;closeRemoveServiceConfirm();closeModal('addsvc')}
function openRemoveServiceConfirm(){
  const s=servicesCatalog.find(x=>x.id===editingServiceId);
  if(!s||!editingServiceId)return;
  document.getElementById('remove-svc-msg').textContent=
    `Remove ${s.name}?\nThis will permanently delete this service.`;
  openModal('removesvc');
}
function closeRemoveServiceConfirm(){closeModal('removesvc')}
async function confirmRemoveService(){
  if(!editingServiceId||!sb)return;
  const id=editingServiceId;
  const {error}=await sb.from('services').delete().eq('id',id);
  if(error){alert('Delete failed: '+(error.message||error));return}
  servicesCatalog=servicesCatalog.filter(s=>s.id!==id);
  applyServicesCatalog(servicesCatalog);
  editingServiceId=null;
  closeRemoveServiceConfirm();
  closeModal('addsvc');
  showAppToast('Service removed');
}

function openAddonModal(id){
  editingAddonId=id||null;
  const a=id?addonsCatalog.find(x=>x.id===id):null;
  document.getElementById('addon-modal-title').textContent=a?'Edit Add-on':'Add Add-on';
  document.getElementById('addon-name').value=a?.name||'';
  document.getElementById('addon-price').value=a?.price??'';
  const sel=document.getElementById('addon-service');
  sel.innerHTML=`<option value="">— Select service —</option>`+servicesCatalog.map(s=>`<option value="${s.id}" ${a?.service_id===s.id?'selected':''}>${escHtml(s.name)}</option>`).join('');
  const rmBtn=document.getElementById('addon-remove-btn');
  if(rmBtn)rmBtn.style.display=id?'inline-flex':'none';
  openModal('addaddon');
}
async function saveAddonModal(){
  const name=document.getElementById('addon-name').value.trim();
  const price=Number(document.getElementById('addon-price').value)||0;
  const service_id=document.getElementById('addon-service').value||null;
  if(!name){document.getElementById('addon-name').focus();return}
  if(!service_id){alert('Please select a linked service');return}
  const row={name,price,service_id};
  const addonId=editingAddonId;
  try{
    if(!sb){alert('Supabase not connected');return}
    if(addonId){
      const {error}=await sb.from('addons').update(row).eq('id',addonId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('addons').insert(row);
      if(error)throw error;
    }
    editingAddonId=null;
    closeModal('addaddon');
    showAppToast(addonId?'Add-on saved':'Add-on added');
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelAddonModal(){editingAddonId=null;closeRemoveAddonConfirm();closeModal('addaddon')}
function openRemoveAddonConfirm(){
  const a=addonsCatalog.find(x=>x.id===editingAddonId);
  if(!a||!editingAddonId)return;
  document.getElementById('remove-addon-msg').textContent=
    `Remove ${a.name}?\nThis cannot be undone.`;
  openModal('removeaddon');
}
function closeRemoveAddonConfirm(){closeModal('removeaddon')}
async function confirmRemoveAddon(){
  if(!editingAddonId||!sb)return;
  const id=editingAddonId;
  const {error}=await sb.from('addons').delete().eq('id',id);
  if(error){alert('Delete failed: '+(error.message||error));return}
  addonsCatalog=addonsCatalog.filter(a=>a.id!==id);
  applyAddonsCatalog(addonsCatalog);
  editingAddonId=null;
  closeRemoveAddonConfirm();
  closeModal('addaddon');
  showAppToast('Add-on removed');
}

function selectCommMethod(method){
  const m=method==='flat'?'flat':'percent';
  document.getElementById('comm-method').value=m;
  document.getElementById('comm-btn-percent')?.classList.toggle('active-method',m==='percent');
  document.getElementById('comm-btn-flat')?.classList.toggle('active-method',m==='flat');
  const rateField=document.getElementById('comm-field-rate');
  const flatField=document.getElementById('comm-field-flat');
  if(rateField)rateField.style.display=m==='percent'?'':'none';
  if(flatField)flatField.style.display=m==='flat'?'':'none';
}
function openCommissionModal(id){
  editingCommissionId=id||null;
  const c=id?commissionsCatalog.find(x=>x.id===id):null;
  document.getElementById('comm-modal-title').textContent=c?'Edit Commission':'Add Commission';
  document.getElementById('comm-name').value=c?.name||'';
  document.getElementById('comm-rate').value=c?.rate??40;
  document.getElementById('comm-flat').value=c?.price??35;
  document.getElementById('comm-apply-to').value=c?.apply_to||'all';
  document.getElementById('comm-staff-target').value=c?.staff_target||'all';
  selectCommMethod(c?.method||'percent');
  const rmBtn=document.getElementById('comm-remove-btn');
  if(rmBtn)rmBtn.style.display=id?'inline-flex':'none';
  openModal('addcommission');
}
async function saveCommissionModal(){
  const name=document.getElementById('comm-name').value.trim();
  const method=document.getElementById('comm-method').value==='flat'?'flat':'percent';
  const rate=method==='percent'?(Number(document.getElementById('comm-rate').value)||0):0;
  const price=method==='flat'?(Number(document.getElementById('comm-flat').value)||0):0;
  const apply_to=document.getElementById('comm-apply-to').value||'all';
  const staff_target=document.getElementById('comm-staff-target').value||'all';
  if(!name){document.getElementById('comm-name').focus();return}
  const row={name,method,rate,price,apply_to,staff_target};
  try{
    if(!sb){alert('Supabase not connected');return}
    if(editingCommissionId){
      const {error}=await sb.from('commissions').update(row).eq('id',editingCommissionId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('commissions').insert(row);
      if(error)throw error;
    }
    editingCommissionId=null;
    closeModal('addcommission');await loadCommissionsCatalog();
    showAppToast('Commission saved');
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelCommissionModal(){editingCommissionId=null;closeModal('addcommission')}
async function confirmRemoveCommission(){
  if(!editingCommissionId||!sb)return;
  if(!confirm('Remove this commission rule?'))return;
  const id=editingCommissionId;
  const {error}=await sb.from('commissions').delete().eq('id',id);
  if(error){alert('Delete failed: '+(error.message||error));return}
  editingCommissionId=null;
  closeModal('addcommission');await loadCommissionsCatalog();
  showAppToast('Commission removed');
}

function openRoomModal(id){
  editingRoomId=id||null;
  const r=id?roomsCatalog.find(x=>x.id===id):null;
  document.getElementById('room-modal-title').textContent=r?'Edit Room':'Add Room';
  document.getElementById('room-name').value=r?.name||'';
  document.getElementById('room-capacity').value=r?.capacity??1;
  openModal('addroom');
}
async function saveRoomModal(){
  const name=document.getElementById('room-name').value.trim();
  const capacity=Math.max(1,Number(document.getElementById('room-capacity').value)||1);
  if(!name){document.getElementById('room-name').focus();return}
  const row={name,capacity,status:editingRoomId?(roomsCatalog.find(r=>r.id===editingRoomId)?.status||'active'):'active'};
  try{
    if(!sb){alert('Supabase not connected');return}
    if(editingRoomId){
      const {error}=await sb.from('rooms').update(row).eq('id',editingRoomId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('rooms').insert(row);
      if(error)throw error;
    }
    closeModal('addroom');await loadRoomsCatalog();
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelRoomModal(){editingRoomId=null;closeModal('addroom')}
async function toggleRoomStatus(id){
  const r=roomsCatalog.find(x=>x.id===id);if(!r||!sb)return;
  const status=r.status==='active'?'inactive':'active';
  const {error}=await sb.from('rooms').update({status}).eq('id',id);
  if(error){alert('Update failed');return}
  r.status=status;renderRooms();syncCatalogGlobals();
}
async function removeRoom(id){
  if(!confirm('Remove this room?'))return;
  if(!sb)return;
  const {error}=await sb.from('rooms').delete().eq('id',id);
  if(error){alert('Delete failed');return}
  await loadRoomsCatalog();
}

function sortByName(list,key='name'){return[...list].sort((a,b)=>String(a[key]||'').localeCompare(String(b[key]||'')))}

async function loadServicesCatalog(){
  if(!sb){applyServicesCatalog(DEFAULT_SVCS.map(s=>({...s,id:null})));return}
  try{
    const {data,error}=await sb.from('services').select('*');
    if(error)throw error;
    const rows=(data?.length?data:DEFAULT_SVCS).map(s=>rowToService(s));
    applyServicesCatalog(rows);
  }catch(e){console.error('loadServicesCatalog:',e);applyServicesCatalog(DEFAULT_SVCS.map(s=>({...s,id:null})))}
}
async function loadAddonsCatalog(){
  if(!sb){addonsCatalog=DEFAULT_ADDONS.map(s=>({...s}));applyAddonsCatalog(addonsCatalog);return}
  try{
    const {data,error}=await sb.from('addons').select('*');
    if(error)throw error;
    const rows=(data?.length?data:DEFAULT_ADDONS).map(a=>rowToAddon(a));
    applyAddonsCatalog(rows);
  }catch(e){console.error('loadAddonsCatalog:',e);applyAddonsCatalog(DEFAULT_ADDONS.map(s=>({...s})))}
}
async function loadCommissionsCatalog(){
  if(!sb){commissionsCatalog=[];renderCommissions();return}
  try{
    const {data,error}=await sb.from('commissions').select('*');
    if(error)throw error;
    commissionsCatalog=sortByName((data||[]).map(rowToCommission));
    renderCommissions();
  }catch(e){console.error('loadCommissionsCatalog:',e);commissionsCatalog=[];renderCommissions()}
}
async function loadRoomsCatalog(){
  if(!sb){roomsCatalog=DEFAULT_ROOMS.map(r=>({...r}));syncCatalogGlobals();renderRooms();return}
  try{
    const {data,error}=await sb.from('rooms').select('*');
    if(error)throw error;
    roomsCatalog=sortByName((data?.length?data:DEFAULT_ROOMS).map(r=>({id:r.id,name:r.name,capacity:Number(r.capacity)||1,status:r.status||'active'})));
    syncCatalogGlobals();renderRooms();
  }catch(e){console.error('loadRoomsCatalog:',e);roomsCatalog=DEFAULT_ROOMS.map(r=>({...r}));syncCatalogGlobals();renderRooms()}
}

function loadCatalogSection(id){
  if(id==='services')loadServicesCatalog();
  if(id==='addons'){loadServicesCatalog().then(loadAddonsCatalog)}
  if(id==='commission')loadCommissionsCatalog();
  if(id==='rooms')loadRoomsCatalog();
}
function setupCatalogRealtime(){
  if(!sb||catalogRealtimeReady)return;
  catalogRealtimeReady=true;
  setupServicesRealtime();
  setupAddonsRealtime();
  sb.channel('cat-commissions').on('postgres_changes',{event:'*',schema:'public',table:'commissions'},()=>loadCommissionsCatalog()).subscribe();
  sb.channel('cat-rooms').on('postgres_changes',{event:'*',schema:'public',table:'rooms'},()=>loadRoomsCatalog()).subscribe();
}
