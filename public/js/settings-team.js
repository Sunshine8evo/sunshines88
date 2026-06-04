/* Settings: Sunshines Team accounts — only role ss_team */

let teamAccounts=[];
let editingTeamKey=null;
let teamRealtimeReady=false;
const SS_TEAM_ROLE='ss_team';

function updateTeamSettingsVisibility(){
  updateSsTeamSettingsMenusVisibility();
}

function setSettingsMenuItemVisible(id,show){
  const el=document.getElementById(id);
  if(!el)return;
  if(show){
    el.style.display='flex';
    el.removeAttribute('hidden');
    el.classList.add('ss-menu-visible');
  }else{
    el.style.display='none';
    el.setAttribute('hidden','');
    el.classList.remove('ss-menu-visible');
  }
}

function updateRolesMenuVisibility(){
  const show=typeof canViewSsTeamSettingsMenus==='function'&&canViewSsTeamSettingsMenus();
  setSettingsMenuItemVisible('sm-roles',show);
}

function updateSsTeamMenuVisibility(){
  const show=typeof canViewSsTeamMenu==='function'
    ?canViewSsTeamMenu()
    :(typeof canViewSsTeamSettingsMenus==='function'&&canViewSsTeamSettingsMenus());
  setSettingsMenuItemVisible('sm-ssteam',show);
}

function syncSsTeamSettingsUserClass(){
  const allowed=typeof canViewSsTeamMenu==='function'&&canViewSsTeamMenu();
  document.documentElement.classList.toggle('ss-team-settings-user',!!allowed);
}

function updateSsTeamSettingsMenusVisibility(){
  updateRolesMenuVisibility();
  updateSsTeamMenuVisibility();
  syncSsTeamSettingsUserClass();
}

function teamUsernameKey(username){
  return String(username||'').trim().toLowerCase();
}

function teamAccountKey(t){
  if(t.id)return String(t.id);
  return 'user:'+teamUsernameKey(t.username);
}

function findTeamAccount(key){
  return teamAccounts.find(t=>teamAccountKey(t)===key)||null;
}

function isSsTeamRole(row){
  return String(row?.role||SS_TEAM_ROLE).toLowerCase()===SS_TEAM_ROLE;
}

function renderTeamList(){
  const el=document.getElementById('ssteam-list');
  if(!el)return;
  el.innerHTML=teamAccounts.length?teamAccounts.map(t=>{
    const key=escTeamHtml(teamAccountKey(t));
    return `<div class="svc-item">
      <div class="svc-name">${escTeamHtml(t.username)}</div>
      <div class="svc-dur" style="flex:1;font-size:11px;color:var(--t2)">${escTeamHtml(t.password)}</div>
      <button class="btn btn-sm" type="button" onclick="openTeamModal('${key}')"><i class="ti ti-edit"></i></button>
      <button class="btn btn-sm btn-ghost" type="button" onclick="removeTeamAccount('${key}')"><i class="ti ti-trash"></i></button>
    </div>`;
  }).join(''):`<div class="intake-empty">${tr('ssteam_empty')||'No team accounts yet.'}</div>`;
}

function escTeamHtml(v){
  return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}

function openTeamModal(key){
  if(typeof canViewSsTeamSettingsMenus==='function'&&!canViewSsTeamSettingsMenus())return;
  editingTeamKey=key||null;
  const t=key?findTeamAccount(key):null;
  document.getElementById('team-modal-title').textContent=t?(tr('edit_team')||'Edit Team'):(tr('add_team')||'Add Team');
  document.getElementById('team-username').value=t?.username||'';
  document.getElementById('team-password').value=t?.password||'';
  const userInput=document.getElementById('team-username');
  if(userInput)userInput.readOnly=!!t;
  openModal('ssteam');
}

function cancelTeamModal(){
  editingTeamKey=null;
  const userInput=document.getElementById('team-username');
  if(userInput)userInput.readOnly=false;
  closeModal('ssteam');
}

async function saveTeamModal(){
  const username=document.getElementById('team-username').value.trim();
  const password=document.getElementById('team-password').value;
  if(!username){document.getElementById('team-username').focus();return}
  if(!password){document.getElementById('team-password').focus();return}
  if(!sb){alert('Supabase not connected');return}
  try{
    const existing=editingTeamKey?findTeamAccount(editingTeamKey):null;
    const teamRow={
      username,
      password,
      role:SS_TEAM_ROLE,
      sort_order:existing?.sort_order??teamAccounts.length+1,
      updated_at:new Date().toISOString()
    };
    if(existing?.id){
      const {error}=await sb.from('sunshines_team').update(teamRow).eq('id',existing.id);
      if(error)throw error;
    }else{
      const {error}=await sb.from('sunshines_team').insert(teamRow);
      if(error){
        const legacy={username,password,sort_order:teamRow.sort_order,updated_at:teamRow.updated_at};
        const ins=await sb.from('sunshines_team').insert(legacy);
        if(ins.error)throw ins.error;
      }
    }
    await upsertStaffAuthRecord(sb,{
      username,
      password,
      auth_role:SS_TEAM_ROLE,
      name:username,
      full_name:username
    });
    cancelTeamModal();
    await loadTeamAccounts();
    showSetMsg('ssteam-save-msg',tr('saved')||'Saved');
  }catch(e){
    console.error(e);
    alert((tr('error')||'Error')+': '+(e.message||e));
  }
}

async function removeTeamAccount(key){
  const t=findTeamAccount(key);
  if(!t||!confirm('Remove this team account?'))return;
  if(!sb)return;
  const uname=teamUsernameKey(t.username);
  try{
    if(t.id){
      const {error}=await sb.from('sunshines_team').delete().eq('id',t.id);
      if(error)throw error;
    }
    if(uname){
      await sb.from('staff_auth').delete().eq('username',uname).eq('role',SS_TEAM_ROLE);
    }
    await loadTeamAccounts();
  }catch(e){
    console.error(e);
    alert((tr('error')||'Error')+': '+(e.message||e));
  }
}

async function loadTeamAccounts(){
  updateTeamSettingsVisibility();
  if(typeof canViewSsTeamMenu==='function'&&!canViewSsTeamMenu()){
    teamAccounts=[];
    renderTeamList();
    return;
  }
  if(!sb){teamAccounts=[];renderTeamList();return}
  try{
    const authRes=await sb
      .from('staff_auth')
      .select('username,password,role,name,display_name')
      .eq('role',SS_TEAM_ROLE)
      .order('username',{ascending:true});

    if(authRes.error)throw authRes.error;

    let teamRes=await sb
      .from('sunshines_team')
      .select('*')
      .eq('role',SS_TEAM_ROLE)
      .order('sort_order',{ascending:true});

    if(teamRes.error&&/role/i.test(teamRes.error.message||'')){
      teamRes=await sb.from('sunshines_team').select('*').order('sort_order',{ascending:true});
    }

    const teamByUser={};
    (teamRes.data||[]).forEach(row=>{
      if(!isSsTeamRole(row)&&row.role!=null)return;
      teamByUser[teamUsernameKey(row.username)]=row;
    });

    teamAccounts=(authRes.data||[]).map(auth=>{
      const key=teamUsernameKey(auth.username);
      const team=teamByUser[key];
      return {
        id:team?.id||null,
        username:auth.username,
        password:team?.password||auth.password,
        role:SS_TEAM_ROLE,
        sort_order:team?.sort_order??0,
        name:auth.name,
        display_name:auth.display_name
      };
    });

    renderTeamList();
  }catch(e){
    console.error('loadTeamAccounts:',e);
    teamAccounts=[];
    renderTeamList();
  }
}

function loadTeamSettingsSection(id){
  if(id==='ssteam'){
    if(typeof canViewSsTeamSettingsMenus==='function'&&!canViewSsTeamSettingsMenus())return;
    loadTeamAccounts();
  }
}

function setupTeamRealtime(){
  if(typeof canViewSsTeamMenu==='function'&&!canViewSsTeamMenu())return;
  if(!sb||teamRealtimeReady)return;
  teamRealtimeReady=true;
  sb.channel('set-ssteam')
    .on('postgres_changes',{event:'*',schema:'public',table:'sunshines_team'},()=>loadTeamAccounts())
    .on('postgres_changes',{event:'*',schema:'public',table:'staff_auth'},()=>loadTeamAccounts())
    .subscribe();
}
