/* Settings: Sunshines Team accounts */

let teamAccounts=[];
let editingTeamId=null;
let teamRealtimeReady=false;

function updateTeamSettingsVisibility(){
  const show=typeof canManageStaffAuth==='function'&&canManageStaffAuth();
  const menu=document.getElementById('sm-ssteam');
  if(menu)menu.style.display=show?'flex':'none';
}

function renderTeamList(){
  const el=document.getElementById('ssteam-list');
  if(!el)return;
  el.innerHTML=teamAccounts.length?teamAccounts.map(t=>`
    <div class="svc-item">
      <div class="svc-name">${escTeamHtml(t.username)}</div>
      <div class="svc-dur" style="flex:1;font-size:11px;color:var(--t2)">${escTeamHtml(t.password)}</div>
      <button class="btn btn-sm" type="button" onclick="openTeamModal('${t.id}')"><i class="ti ti-edit"></i></button>
      <button class="btn btn-sm btn-ghost" type="button" onclick="removeTeamAccount('${t.id}')"><i class="ti ti-trash"></i></button>
    </div>`).join(''):`<div class="intake-empty">${tr('ssteam_empty')||'No team accounts yet.'}</div>`;
}

function escTeamHtml(v){
  return String(v||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
}

function openTeamModal(id){
  editingTeamId=id||null;
  const t=id?teamAccounts.find(x=>x.id===id):null;
  document.getElementById('team-modal-title').textContent=t?(tr('edit_team')||'Edit Team'):(tr('add_team')||'Add Team');
  document.getElementById('team-username').value=t?.username||'';
  document.getElementById('team-password').value=t?.password||'';
  openModal('ssteam');
}

function cancelTeamModal(){
  editingTeamId=null;
  closeModal('ssteam');
}

async function saveTeamModal(){
  const username=document.getElementById('team-username').value.trim();
  const password=document.getElementById('team-password').value;
  if(!username){document.getElementById('team-username').focus();return}
  if(!password){document.getElementById('team-password').focus();return}
  if(!sb){alert('Supabase not connected');return}
  try{
    const row={
      username,
      password,
      sort_order:editingTeamId?(teamAccounts.find(t=>t.id===editingTeamId)?.sort_order||0):teamAccounts.length+1,
      updated_at:new Date().toISOString()
    };
    if(editingTeamId){
      const {error}=await sb.from('sunshines_team').update(row).eq('id',editingTeamId);
      if(error)throw error;
    }else{
      const {error}=await sb.from('sunshines_team').insert(row);
      if(error)throw error;
    }
    await upsertStaffAuthRecord(sb,{
      username,
      password,
      auth_role:'ss_team',
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

async function removeTeamAccount(id){
  const t=teamAccounts.find(x=>x.id===id);
  if(!t||!confirm('Remove this team account?'))return;
  if(!sb)return;
  try{
    const {error}=await sb.from('sunshines_team').delete().eq('id',id);
    if(error)throw error;
    if(t.username){
      await sb.from('staff_auth').delete().eq('username',String(t.username).trim().toLowerCase());
    }
    await loadTeamAccounts();
  }catch(e){
    console.error(e);
    alert((tr('error')||'Error')+': '+(e.message||e));
  }
}

async function loadTeamAccounts(){
  updateTeamSettingsVisibility();
  if(!sb){teamAccounts=[];renderTeamList();return}
  try{
    const {data,error}=await sb.from('sunshines_team').select('*').order('sort_order',{ascending:true});
    if(error)throw error;
    teamAccounts=data||[];
    renderTeamList();
  }catch(e){
    console.error('loadTeamAccounts:',e);
    teamAccounts=[];
    renderTeamList();
  }
}

function loadTeamSettingsSection(id){
  if(id==='ssteam')loadTeamAccounts();
}

function setupTeamRealtime(){
  if(!sb||teamRealtimeReady)return;
  teamRealtimeReady=true;
  sb.channel('set-ssteam').on('postgres_changes',{event:'*',schema:'public',table:'sunshines_team'},()=>loadTeamAccounts()).subscribe();
}
