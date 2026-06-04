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

function normalizeAuthRole(role){
  return String(role||'').trim().toLowerCase();
}

/** Auth role from session only (not display overrides). */
function getSessionAuthRole(user){
  user=user||getSessionUser();
  return normalizeAuthRole(user.role);
}

/** Settings sidebar: Roles + SS Team — visible only when session role is ss_team. */
function canViewSsTeamSettingsMenus(user){
  return getSessionAuthRole(user)==='ss_team';
}

/** Settings sidebar: SS Team menu — ss_team role only. */
function canViewSsTeamMenu(user){
  return getSessionAuthRole(user)==='ss_team';
}

/** SS Team accounts (not sunshines* super user) — Settings nav only on index.html */
function isRestrictedSsTeamUser(user){
  user=user||getSessionUser();
  const info=getNavUserDisplay(user);
  if(info.effectiveRole!=='ss_team')return false;
  if(isSunshinesUsername(user.username))return false;
  return true;
}

function canAccessNavPage(pageId,user){
  if(!isRestrictedSsTeamUser(user))return true;
  if(pageId==='employee')return false;
  return pageId==='settings';
}

function authRoleLabel(role){
  return AUTH_ROLE_LABELS[role]||role||'—';
}

function staffAuthEmail(username){
  return String(username||'').trim().toLowerCase()+'@sunshines88.com';
}

/** Browser fallback when /api/auth/login is outdated — keep in sync with src/lib/auth/staff-users.ts */
const FALLBACK_AUTH_USERS=[
  {username:'owner',password:'owner123',role:'owner',name:'Owner',displayName:'Owner Admin'},
  {username:'sunshines',password:'Bowvy',role:'ss_team',name:'Sunshines',displayName:'Sunshines'},
  {username:'manager',password:'mgr123',role:'manager',name:'Manager',displayName:'Manager'},
  {username:'reception',password:'rec123',role:'reception',name:'Reception',displayName:'Reception'},
  {username:'staff',password:'staff123',role:'staff',name:'Pam',displayName:'Pam (Staff)'},
  {username:'pam',password:'pam123',role:'staff',name:'Pam',displayName:'Pam'},
  {username:'noon',password:'noon123',role:'staff',name:'Noon',displayName:'Noon'},
  {username:'min',password:'min123',role:'staff',name:'Min',displayName:'Min'},
  {username:'jane',password:'jane123',role:'staff',name:'Jane',displayName:'Jane'},
  {username:'mumu',password:'2810',role:'manager',name:'Mumu',displayName:'Mumu'},
  {username:'piglet',password:'2810',role:'owner',name:'Piglet',displayName:'Piglet'}
];

function toPublicAuthUser(row,loginUsername){
  const key=String(loginUsername||'').trim().toLowerCase();
  const user={
    username:row.username,
    role:row.role||'staff',
    name:row.name||row.username,
    displayName:row.displayName||row.name||row.username
  };
  if(key.startsWith('sunshines')){
    user.role='ss_team';
    user.displayName=String(loginUsername).trim();
    user.name=String(loginUsername).trim();
  }
  return user;
}

function lookupFallbackAuthUser(username,password){
  const key=String(username||'').trim().toLowerCase();
  const pass=String(password??'');
  const row=FALLBACK_AUTH_USERS.find(u=>u.username===key&&String(u.password)===pass);
  return row?toPublicAuthUser(row,username):null;
}

async function loginViaStaffAuthDirect(username,password){
  try{
    if(typeof supabase==='undefined')return null;
    const cfgRes=await fetch('/api/supabase-config');
    if(!cfgRes.ok)return null;
    const {url,anonKey}=await cfgRes.json();
    if(!url||!anonKey)return null;
    const client=supabase.createClient(url,anonKey);
    const key=String(username||'').trim().toLowerCase();
    const {data,error}=await client
      .from('staff_auth')
      .select('username,password,role,name,display_name')
      .eq('username',key)
      .maybeSingle();
    if(error||!data)return null;
    if(String(data.password??'')!==String(password??''))return null;
    return toPublicAuthUser({
      username:data.username,
      role:data.role,
      name:data.name,
      displayName:data.display_name
    },username);
  }catch(e){
    console.warn('loginViaStaffAuthDirect:',e);
    return null;
  }
}

async function resolveLoginUser(username,password){
  const u=String(username||'').trim();
  const p=String(password??'');
  if(!u||!p)return null;
  try{
    const res=await fetch('/api/auth/login',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({username:u,password:p})
    });
    const data=await res.json().catch(()=>({}));
    if(res.ok&&data.user)return data.user;
  }catch(e){
    console.warn('resolveLoginUser api:',e);
  }
  const fromDb=await loginViaStaffAuthDirect(u,p);
  if(fromDb)return fromDb;
  return lookupFallbackAuthUser(u,p);
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
