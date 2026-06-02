/* Settings: Business Hours, Intake Form, Roles — Supabase sync */

const MENU_DEFS=[
  {key:'calendar',label:'Calendar',i18n:'nav_calendar'},
  {key:'display',label:'Queue Display',i18n:'nav_display'},
  {key:'employees',label:'Employees',i18n:'nav_employees'},
  {key:'clients',label:'Clients',i18n:'nav_clients'},
  {key:'settings',label:'Settings',i18n:'nav_settings'},
  {key:'payroll',label:'Payroll',i18n:'nav_payroll'},
  {key:'sales',label:'Sales Summary',i18n:'nav_sales'}
];

const INTAKE_SECTION_TITLES={
  personal:'Personal Information',
  emergency:'Emergency Contact',
  health:'Health Information',
  preferences:'Service Preferences',
  consent:'Consent & Policy'
};

const DEFAULT_BUSINESS_HOURS=[
  {day_index:0,day_name:'Monday',is_open:true,open_time:'10:00',close_time:'21:00'},
  {day_index:1,day_name:'Tuesday',is_open:true,open_time:'10:00',close_time:'21:00'},
  {day_index:2,day_name:'Wednesday',is_open:true,open_time:'10:00',close_time:'21:00'},
  {day_index:3,day_name:'Thursday',is_open:true,open_time:'10:00',close_time:'21:00'},
  {day_index:4,day_name:'Friday',is_open:true,open_time:'10:00',close_time:'22:00'},
  {day_index:5,day_name:'Saturday',is_open:true,open_time:'09:00',close_time:'22:00'},
  {day_index:6,day_name:'Sunday',is_open:false,open_time:'10:00',close_time:'18:00'}
];

const DEFAULT_INTAKE_STANDARD=[
  {section:'personal',fields:[
    {id:'first_name',label:'First Name',type:'text',enabled:true,locked:true},
    {id:'last_name',label:'Last Name',type:'text',enabled:true,locked:true},
    {id:'phone',label:'Phone Number',type:'text',enabled:true,locked:true},
    {id:'email',label:'Email',type:'text',enabled:true,locked:true},
    {id:'dob',label:'Date of Birth',type:'date',enabled:true,locked:true}
  ]},
  {section:'emergency',fields:[
    {id:'emergency_name',label:'Emergency Contact Name',type:'text',enabled:true,locked:true},
    {id:'emergency_phone',label:'Emergency Phone',type:'text',enabled:true,locked:true}
  ]},
  {section:'health',fields:[
    {id:'allergies',label:'Allergies',type:'text',enabled:true,locked:true},
    {id:'medical_conditions',label:'Medical Conditions',type:'text',enabled:true,locked:true},
    {id:'pregnancy',label:'Pregnancy',type:'yes-no',enabled:true,locked:true},
    {id:'recent_surgery',label:'Recent Surgery',type:'yes-no',enabled:true,locked:true},
    {id:'surgery_details',label:'Surgery Details',type:'text',enabled:true,locked:true,dependsOn:'recent_surgery'}
  ]},
  {section:'preferences',fields:[
    {id:'pressure',label:'Pressure Preference',type:'choice',options:['Light','Medium','Firm'],enabled:true,locked:true},
    {id:'areas_concern',label:'Areas of Concern',type:'text',enabled:true,locked:true}
  ]},
  {section:'consent',fields:[
    {id:'cancel_policy',label:'Cancellation Policy',type:'checkbox',enabled:true,locked:true},
    {id:'liability_waiver',label:'Liability Waiver',type:'checkbox',enabled:true,locked:true},
    {id:'signature',label:'Signature (digital pad)',type:'signature',enabled:true,locked:true}
  ]}
];

const DEFAULT_ROLES=[
  {role_key:'owner',label:'Owner',icon:'ti-crown',color:'#fdf0f3',text_color:'#8a1a30',menu_permissions:{calendar:true,display:true,employees:true,clients:true,settings:true,payroll:true,sales:true},is_system:true,sort_order:1},
  {role_key:'manager',label:'Manager',icon:'ti-user-check',color:'#eaf3fc',text_color:'#0c447c',menu_permissions:{calendar:true,display:true,employees:true,clients:true,settings:true,payroll:true,sales:true},is_system:true,sort_order:2},
  {role_key:'reception',label:'Reception',icon:'ti-headset',color:'#fdf6e7',text_color:'#7d5a00',menu_permissions:{calendar:true,display:true,employees:false,clients:true,settings:false,payroll:false,sales:true},is_system:true,sort_order:3},
  {role_key:'staff',label:'Staff',icon:'ti-user',color:'#f4f4f4',text_color:'#555555',menu_permissions:{calendar:true,display:true,employees:false,clients:false,settings:false,payroll:true,sales:false},is_system:true,sort_order:4}
];

let businessHours=[...DEFAULT_BUSINESS_HOURS];
let intakeStandard=JSON.parse(JSON.stringify(DEFAULT_INTAKE_STANDARD));
let intakeCustom=[];
let intakeFormId=null;
let rolesData=[...DEFAULT_ROLES];
let editingRoleKey=null;
let settingsRealtimeReady=false;

function isSunshinesTeamUser(){
  try{const u=JSON.parse(sessionStorage.getItem('sunshine_user')||'{}');return u.username==='sunshines'}catch(e){return false}
}
function showSetMsg(id,msg){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=msg;el.style.display='inline';
  clearTimeout(el._t);el._t=setTimeout(()=>{el.style.display='none'},2500);
}
function fmtHourType(t){return({text:'Text',date:'Date','yes-no':'Yes/No',choice:'Choice',checkbox:'Checkbox',signature:'Signature'}[t]||t)}

function renderHours(){
  const el=document.getElementById('hours-rows');if(!el)return;
  el.innerHTML=businessHours.map((h,i)=>`
    <div class="hours-row ${h.is_open?'':'hours-closed'}">
      <span class="hours-day">${h.day_name}</span>
      ${h.is_open?`
        <div class="hours-times">
          <label class="hours-lbl">${tr('hours_open')||'Open'}</label>
          <input type="time" value="${h.open_time||'10:00'}" onchange="onHoursTime(${i},'open_time',this.value)">
          <span class="hours-sep">—</span>
          <label class="hours-lbl">${tr('hours_close')||'Close'}</label>
          <input type="time" value="${h.close_time||'21:00'}" onchange="onHoursTime(${i},'close_time',this.value)">
        </div>`:`
        <div class="hours-gap"><i class="ti ti-moon"></i> ${tr('hours_gap')||'Closed (Gap day)'}</div>`}
      <div class="hours-toggle-wrap">
        <span class="hours-open-lbl">${h.is_open?(tr('open')||'Open'):(tr('closed')||'Closed')}</span>
        <div class="tgl ${h.is_open?'on':''}" onclick="toggleHoursOpen(${i})"></div>
      </div>
    </div>`).join('');
}
function onHoursTime(i,field,val){if(businessHours[i])businessHours[i][field]=val}
function toggleHoursOpen(i){if(!businessHours[i])return;businessHours[i].is_open=!businessHours[i].is_open;renderHours()}

async function loadBusinessHours(){
  if(!sb){businessHours=[...DEFAULT_BUSINESS_HOURS];renderHours();return}
  try{
    const {data,error}=await sb.from('business_hours').select('*').order('day_index',{ascending:true});
    if(error)throw error;
    if(data?.length)businessHours=data.map(r=>({
      id:r.id,day_index:r.day_index,day_name:r.day_name,is_open:!!r.is_open,
      open_time:(r.open_time||'10:00').slice(0,5),close_time:(r.close_time||'21:00').slice(0,5)
    }));
    else businessHours=[...DEFAULT_BUSINESS_HOURS];
    renderHours();
  }catch(e){console.error('loadBusinessHours:',e);businessHours=[...DEFAULT_BUSINESS_HOURS];renderHours()}
}
async function saveBusinessHours(){
  if(!sb){alert(tr('save_error')||'Save failed — Supabase not connected');return}
  const btn=document.getElementById('hours-save-btn');if(btn)btn.disabled=true;
  try{
    for(const h of businessHours){
      const row={day_index:h.day_index,day_name:h.day_name,is_open:!!h.is_open,open_time:h.open_time,close_time:h.close_time,updated_at:new Date().toISOString()};
      if(h.id){
        const {error}=await sb.from('business_hours').update(row).eq('id',h.id);
        if(error)throw error;
      }else{
        const {data,error}=await sb.from('business_hours').upsert(row,{onConflict:'day_index'}).select('id').single();
        if(error)throw error;
        h.id=data?.id;
      }
    }
    showSetMsg('hours-save-msg',tr('saved')||'Saved');
  }catch(e){console.error('saveBusinessHours:',e);alert(tr('save_error')||'Save failed')}
  finally{if(btn)btn.disabled=false}
}

function renderIntake(){
  const stdEl=document.getElementById('intake-standard');if(!stdEl)return;
  stdEl.innerHTML=intakeStandard.map(sec=>`
    <div class="intake-section">
      <div class="intake-sec-title">${INTAKE_SECTION_TITLES[sec.section]||sec.section}</div>
      ${(sec.fields||[]).map(f=>`
        <div class="intake-field-row">
          <span>${f.label} <span class="intake-type">(${fmtHourType(f.type)})</span></span>
          <div class="tgl ${f.enabled!==false?'on':''}" onclick="toggleIntakeField('${sec.section}','${f.id}')"></div>
        </div>`).join('')}
    </div>`).join('');
  const custEl=document.getElementById('intake-custom-list');
  if(custEl){
    custEl.innerHTML=intakeCustom.length?intakeCustom.map((f,i)=>`
      <div class="intake-field-row">
        <span>${f.name} <span class="intake-type">(${fmtHourType(f.type)})</span></span>
        <div class="row-btns">
          <button class="btn btn-sm btn-ghost" type="button" onclick="removeCustomIntakeField(${i})"><i class="ti ti-trash"></i></button>
        </div>
      </div>`).join(''):`<div class="intake-empty">${tr('no_custom_fields')||'No custom fields yet.'}</div>`;
  }
}
function toggleIntakeField(section,fieldId){
  const sec=intakeStandard.find(s=>s.section===section);if(!sec)return;
  const f=sec.fields.find(x=>x.id===fieldId);if(!f)return;
  f.enabled=f.enabled===false?true:false;
  renderIntake();
}
function removeCustomIntakeField(i){intakeCustom.splice(i,1);renderIntake()}
function openAddIntakeField(){
  document.getElementById('cf-name').value='';
  document.getElementById('cf-type').value='text';
  openModal('addintake');
}
function confirmAddIntakeField(){
  const name=document.getElementById('cf-name').value.trim();
  if(!name){document.getElementById('cf-name').focus();return}
  intakeCustom.push({id:'cf_'+Date.now(),name,type:document.getElementById('cf-type').value,enabled:true});
  closeModal('addintake');renderIntake();
}

async function loadIntakeForm(){
  if(!sb){intakeStandard=JSON.parse(JSON.stringify(DEFAULT_INTAKE_STANDARD));intakeCustom=[];renderIntake();return}
  try{
    const {data,error}=await sb.from('intake_form').select('*').limit(1).maybeSingle();
    if(error)throw error;
    if(data){
      intakeFormId=data.id;
      intakeStandard=Array.isArray(data.standard_fields)?data.standard_fields:JSON.parse(JSON.stringify(DEFAULT_INTAKE_STANDARD));
      intakeCustom=Array.isArray(data.custom_fields)?data.custom_fields:[];
    }else{
      intakeStandard=JSON.parse(JSON.stringify(DEFAULT_INTAKE_STANDARD));
      intakeCustom=[];
    }
    renderIntake();
  }catch(e){console.error('loadIntakeForm:',e);renderIntake()}
}
async function saveIntakeForm(){
  if(!sb){alert(tr('save_error')||'Save failed');return}
  const btn=document.getElementById('intake-save-btn');if(btn)btn.disabled=true;
  const payload={standard_fields:intakeStandard,custom_fields:intakeCustom,updated_at:new Date().toISOString()};
  try{
    if(intakeFormId){
      const {error}=await sb.from('intake_form').update(payload).eq('id',intakeFormId);
      if(error)throw error;
    }else{
      const {data,error}=await sb.from('intake_form').insert(payload).select('id').single();
      if(error)throw error;
      intakeFormId=data?.id;
    }
    showSetMsg('intake-save-msg',tr('saved')||'Saved');
  }catch(e){console.error('saveIntakeForm:',e);alert(tr('save_error')||'Save failed')}
  finally{if(btn)btn.disabled=false}
}

function rolePermSummary(r){
  return MENU_DEFS.filter(m=>r.menu_permissions?.[m.key]!==false).map(m=>tr(m.i18n)||m.label).join(' · ');
}
function renderRoles(){
  const el=document.getElementById('roles-list');if(!el)return;
  const addBtn=document.getElementById('roles-add-wrap');
  if(addBtn)addBtn.style.display=isSunshinesTeamUser()?'flex':'none';
  el.innerHTML=rolesData.sort((a,b)=>(a.sort_order||0)-(b.sort_order||0)).map(r=>`
    <div class="role-card">
      <div class="role-icon" style="background:${r.color};color:${r.text_color}"><i class="ti ${r.icon||'ti-user'}"></i></div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:500">${r.label}</div>
        <div style="font-size:11px;color:#888;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${rolePermSummary(r)}</div>
      </div>
      <button class="btn btn-sm" type="button" onclick="openRoleEdit('${r.role_key}')"><i class="ti ti-edit"></i>${tr('edit')||'Edit'}</button>
    </div>`).join('');
}
function openRoleEdit(roleKey){
  editingRoleKey=roleKey;
  const r=rolesData.find(x=>x.role_key===roleKey);if(!r)return;
  document.getElementById('role-edit-title').textContent=r.label;
  document.getElementById('role-menu-toggles').innerHTML=MENU_DEFS.map(m=>{
    const on=r.menu_permissions?.[m.key]!==false;
    return `<div class="notify-row"><span>${tr(m.i18n)||m.label}</span><div class="tgl ${on?'on':''}" data-menu="${m.key}" onclick="this.classList.toggle('on')"></div></div>`;
  }).join('');
  openModal('editrole');
}
function saveRoleEdit(){
  const r=rolesData.find(x=>x.role_key===editingRoleKey);if(!r)return;
  const perms={};
  document.querySelectorAll('#role-menu-toggles .tgl').forEach(t=>{
    perms[t.dataset.menu]=t.classList.contains('on');
  });
  r.menu_permissions=perms;
  closeModal('editrole');
  persistRole(r).then(()=>{renderRoles();applyNavFromRoles()});
}
function openAddRoleModal(){
  if(!isSunshinesTeamUser())return;
  document.getElementById('new-role-key').value='';
  document.getElementById('new-role-label').value='';
  openModal('addrole');
}
async function confirmAddRole(){
  if(!isSunshinesTeamUser())return;
  const role_key=document.getElementById('new-role-key').value.trim().toLowerCase().replace(/\s+/g,'_');
  const label=document.getElementById('new-role-label').value.trim();
  if(!role_key||!label){alert('Role key and label required');return}
  if(rolesData.some(r=>r.role_key===role_key)){alert('Role key already exists');return}
  const perms={};MENU_DEFS.forEach(m=>{perms[m.key]=m.key==='calendar'});
  const row={role_key,label,icon:'ti-user',color:'#f4f4f4',text_color:'#555555',menu_permissions:perms,is_system:false,sort_order:rolesData.length+1};
  try{
    if(sb){
      const {data,error}=await sb.from('roles').insert(row).select('*').single();
      if(error)throw error;
      rolesData.push(data);
    }else rolesData.push(row);
    closeModal('addrole');renderRoles();
  }catch(e){console.error(e);alert(tr('save_error')||'Save failed')}
}
async function persistRole(r){
  if(!sb||!r.id)return;
  const {error}=await sb.from('roles').update({
    label:r.label,menu_permissions:r.menu_permissions,updated_at:new Date().toISOString()
  }).eq('id',r.id);
  if(error)console.error('persistRole:',error);
}
async function loadRoles(){
  if(!sb){rolesData=[...DEFAULT_ROLES];renderRoles();return}
  try{
    const {data,error}=await sb.from('roles').select('*').order('sort_order',{ascending:true});
    if(error)throw error;
    if(data?.length)rolesData=data;
    else rolesData=[...DEFAULT_ROLES];
    renderRoles();applyNavFromRoles();
  }catch(e){console.error('loadRoles:',e);renderRoles()}
}
function applyNavFromRoles(){
  const user=JSON.parse(sessionStorage.getItem('sunshine_user')||'{}');
  const role=rolesData.find(r=>r.role_key===(user.role||currentRole));
  const perms=role?.menu_permissions||{};
  const map={calendar:'tab-booking',display:'tab-display',employees:'tab-employee',clients:'tab-clients',settings:'tab-settings',payroll:'tab-payroll',sales:'tab-sales'};
  Object.entries(map).forEach(([key,id])=>{
    const el=document.getElementById(id);if(!el)return;
    const legacy=(el.dataset.roles||'').split(',').includes(user.role||currentRole);
    const allowed=legacy&&(perms[key]!==false);
    el.style.display=allowed?'flex':'none';
  });
}
function loadSettingsSection(id){
  if(id==='hours')loadBusinessHours();
  if(id==='intake')loadIntakeForm();
  if(id==='roles')loadRoles();
}
function setupSettingsRealtime(){
  if(!sb||settingsRealtimeReady)return;
  settingsRealtimeReady=true;
  sb.channel('set-hours').on('postgres_changes',{event:'*',schema:'public',table:'business_hours'},()=>loadBusinessHours()).subscribe();
  sb.channel('set-intake').on('postgres_changes',{event:'*',schema:'public',table:'intake_form'},()=>loadIntakeForm()).subscribe();
  sb.channel('set-roles').on('postgres_changes',{event:'*',schema:'public',table:'roles'},()=>loadRoles()).subscribe();
}
