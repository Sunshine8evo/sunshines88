/* Shared auth display + permission helpers */

const AUTH_ROLE_LABELS={
  owner:'Owner',
  manager:'Manager',
  reception:'Reception',
  staff:'Staff',
  ss_team:'SS Team'
};

const AUTH_ROLE_COLORS={
  owner:{bg:'#fdf0f3',tc:'#8a1a30'},
  manager:{bg:'#eaf3fc',tc:'#0c447c'},
  reception:{bg:'#eaf6ef',tc:'#185a32'},
  staff:{bg:'#fff8e6',tc:'#7a5500'},
  ss_team:{bg:'#fff0f6',tc:'#9d174d'}
};

function getSessionUser(){
  try{return JSON.parse(sessionStorage.getItem('sunshine_user')||'{}')}catch(e){return {}}
}

function isSunshinesUsername(username){
  return String(username||'').trim().toLowerCase().startsWith('sunshines');
}

function getNavUserDisplay(user){
  user=user||getSessionUser();
  const username=String(user.username||'').trim();
  if(isSunshinesUsername(username)){
    return {
      displayName:username,
      roleLabel:'SS Team',
      effectiveRole:'ss_team',
      avatarLetter:(username[0]||'S').toUpperCase()
    };
  }
  const role=user.role||'staff';
  return {
    displayName:user.displayName||user.name||'User',
    roleLabel:AUTH_ROLE_LABELS[role]||String(role).charAt(0).toUpperCase()+String(role).slice(1),
    effectiveRole:role,
    avatarLetter:String(user.name||'?')[0].toUpperCase()
  };
}

function applyNavUserDisplay(user){
  const info=getNavUserDisplay(user);
  const rc=AUTH_ROLE_COLORS[info.effectiveRole]||AUTH_ROLE_COLORS.owner;
  const av=document.getElementById('nav-avatar');
  if(av){
    av.textContent=info.avatarLetter;
    av.style.background=rc.bg;
    av.style.color=rc.tc;
  }
  const un=document.getElementById('nav-username');
  if(un)un.textContent=info.displayName;
  const rl=document.getElementById('nav-role-label');
  if(rl)rl.textContent=info.roleLabel;
  return info;
}

function canManageStaffAuth(user){
  user=user||getSessionUser();
  if(isSunshinesUsername(user.username)||user.role==='ss_team')return true;
  return ['owner','manager'].includes(user.role);
}

function authRoleLabel(role){
  return AUTH_ROLE_LABELS[role]||role||'—';
}

function staffAuthEmail(username){
  return String(username||'').trim().toLowerCase()+'@sunshines88.com';
}

async function upsertStaffAuthRecord(sb, staff){
  if(!sb||!staff?.username)return null;
  const username=String(staff.username).trim().toLowerCase();
  if(!username)return null;
  const row={
    username,
    password:staff.password||'',
    email:staffAuthEmail(username),
    role:staff.auth_role||'staff',
    name:staff.name||username,
    display_name:staff.full_name||staff.name||username,
    updated_at:new Date().toISOString()
  };
  const {error}=await sb.from('staff_auth').upsert(row,{onConflict:'username'});
  if(error)throw error;
  return row;
}
