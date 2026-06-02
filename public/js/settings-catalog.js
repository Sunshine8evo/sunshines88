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
  el.innerHTML=servicesCatalog.length?servicesCatalog.map(s=>`
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
  el.innerHTML=addonsCatalog.length?addonsCatalog.map(a=>{
    const svc=a.service_id?servicesCatalog.find(s=>s.id===a.service_id):null;
    const svcLbl=svc?`<span class="intake-type"> · ${escHtml(svc.name)}</span>`:'';
    return `<div class="svc-item">
      <div class="svc-name">${escHtml(a.name)}${svcLbl}</div>
      <div class="svc-price">+${fmtMoney(a.price)}</div>
      <button class="btn btn-sm" type="button" onclick="openAddonModal('${a.id}')"><i class="ti ti-edit"></i></button>
    </div>`;
  }).join(''):`<div class="intake-empty">No add-ons yet.</div>`;
}
function renderCommissions(){
  const el=document.getElementById('commission-list');if(!el)return;
  el.innerHTML=commissionsCatalog.length?commissionsCatalog.map(c=>{
    const tgt=STAFF_TARGET_OPTS.find(o=>o.v===c.staff_target)?.label||c.staff_target;
    return `<div class="svc-item">
      <div class="svc-name">${escHtml(c.name)}</div>
      <div class="svc-price">${fmtMoney(c.price)}</div>
      <div class="svc-dur" style="flex:1;font-size:11px;color:var(--t2)">${escHtml(tgt)}</div>
      <button class="btn btn-sm" type="button" onclick="openCommissionModal('${c.id}')"><i class="ti ti-edit"></i></button>
    </div>`;
  }).join(''):`<div class="intake-empty">No commissions yet.</div>`;
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
  openModal('addsvc');
}
async function saveServiceModal(){
  const name=document.getElementById('svc-name').value.trim();
  const price=Number(document.getElementById('svc-price').value)||0;
  const duration=Number(document.getElementById('svc-dur').value)||60;
  const type=document.querySelector('input[name=svctype]:checked')?.value||'single';
  if(!name){document.getElementById('svc-name').focus();return}
  const row={name,price,duration,type};
  try{
    if(!sb){alert('Supabase not connected');return}
    if(editingServiceId){
      const {error}=await sb.from('services').update(row).eq('id',editingServiceId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('services').insert(row);
      if(error)throw error;
    }
    closeModal('addsvc');await loadServicesCatalog();
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelServiceModal(){editingServiceId=null;closeModal('addsvc')}

function openAddonModal(id){
  editingAddonId=id||null;
  const a=id?addonsCatalog.find(x=>x.id===id):null;
  document.getElementById('addon-modal-title').textContent=a?'Edit Add-on':'Add Add-on';
  document.getElementById('addon-name').value=a?.name||'';
  document.getElementById('addon-price').value=a?.price??'';
  const sel=document.getElementById('addon-service');
  sel.innerHTML=`<option value="">— Select service —</option>`+servicesCatalog.map(s=>`<option value="${s.id}" ${a?.service_id===s.id?'selected':''}>${escHtml(s.name)}</option>`).join('');
  openModal('addaddon');
}
async function saveAddonModal(){
  const name=document.getElementById('addon-name').value.trim();
  const price=Number(document.getElementById('addon-price').value)||0;
  const service_id=document.getElementById('addon-service').value||null;
  if(!name){document.getElementById('addon-name').focus();return}
  if(!service_id){alert('Please select a linked service');return}
  const row={name,price,service_id};
  try{
    if(!sb){alert('Supabase not connected');return}
    if(editingAddonId){
      const {error}=await sb.from('addons').update(row).eq('id',editingAddonId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('addons').insert(row);
      if(error)throw error;
    }
    closeModal('addaddon');await loadAddonsCatalog();
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelAddonModal(){editingAddonId=null;closeModal('addaddon')}

function openCommissionModal(id){
  editingCommissionId=id||null;
  const c=id?commissionsCatalog.find(x=>x.id===id):null;
  document.getElementById('comm-modal-title').textContent=c?'Edit Commission':'Add Commission';
  document.getElementById('comm-name').value=c?.name||'';
  document.getElementById('comm-price').value=c?.price??'';
  document.getElementById('comm-staff-target').value=c?.staff_target||'all';
  openModal('addcommission');
}
async function saveCommissionModal(){
  const name=document.getElementById('comm-name').value.trim();
  const price=Number(document.getElementById('comm-price').value)||0;
  const staff_target=document.getElementById('comm-staff-target').value||'all';
  if(!name){document.getElementById('comm-name').focus();return}
  const row={name,price,staff_target};
  try{
    if(!sb){alert('Supabase not connected');return}
    if(editingCommissionId){
      const {error}=await sb.from('commissions').update(row).eq('id',editingCommissionId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('commissions').insert(row);
      if(error)throw error;
    }
    closeModal('addcommission');await loadCommissionsCatalog();
  }catch(e){console.error(e);alert('Save failed: '+(e.message||e))}
}
function cancelCommissionModal(){editingCommissionId=null;closeModal('addcommission')}

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
  if(!sb){servicesCatalog=DEFAULT_SVCS.map((s,i)=>({...s,id:null}));syncCatalogGlobals();renderServices();return}
  try{
    const {data,error}=await sb.from('services').select('*');
    if(error)throw error;
    servicesCatalog=sortByName((data?.length?data:DEFAULT_SVCS).map(s=>({id:s.id,name:s.name,price:Number(s.price),duration:Number(s.duration||60),type:s.type||'single'})));
    syncCatalogGlobals();renderServices();
  }catch(e){console.error('loadServicesCatalog:',e);servicesCatalog=DEFAULT_SVCS.map(s=>({...s}));syncCatalogGlobals();renderServices()}
}
async function loadAddonsCatalog(){
  if(!sb){addonsCatalog=DEFAULT_ADDONS.map(s=>({...s}));syncCatalogGlobals();renderAddonsList();return}
  try{
    const {data,error}=await sb.from('addons').select('*');
    if(error)throw error;
    addonsCatalog=sortByName((data?.length?data:DEFAULT_ADDONS).map(a=>({id:a.id,name:a.name,price:Number(a.price),service_id:a.service_id||null})));
    syncCatalogGlobals();renderAddonsList();if(typeof renderModalAddon==='function')renderModalAddon();
  }catch(e){console.error('loadAddonsCatalog:',e);renderAddonsList()}
}
async function loadCommissionsCatalog(){
  if(!sb){commissionsCatalog=[];renderCommissions();return}
  try{
    const {data,error}=await sb.from('commissions').select('*');
    if(error)throw error;
    commissionsCatalog=sortByName(data||[]);
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
  sb.channel('cat-services').on('postgres_changes',{event:'*',schema:'public',table:'services'},()=>loadServicesCatalog()).subscribe();
  sb.channel('cat-addons').on('postgres_changes',{event:'*',schema:'public',table:'addons'},()=>loadAddonsCatalog()).subscribe();
  sb.channel('cat-commissions').on('postgres_changes',{event:'*',schema:'public',table:'commissions'},()=>loadCommissionsCatalog()).subscribe();
  sb.channel('cat-rooms').on('postgres_changes',{event:'*',schema:'public',table:'rooms'},()=>loadRoomsCatalog()).subscribe();
}
