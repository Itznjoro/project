/* ============================================================
   SHARED APP LOGIC
   ============================================================ */

/* ---------- Mobile top-nav toggle (marketing pages) ---------- */
function initNavToggle(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const actions = document.querySelector('.nav-actions');
  if(!toggle) return;
  toggle.addEventListener('click', ()=>{
    links.classList.toggle('open');
    actions.classList.toggle('open');
  });
}

/* ---------- Sidebar toggle (dashboard pages) ---------- */
function initSidebar(){
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.sidebar-toggle');
  const close = document.querySelector('.sidebar-close');
  const overlay = document.querySelector('.overlay');
  if(!sidebar) return;
  const open = ()=>{sidebar.classList.add('open'); overlay.classList.add('show');};
  const shut = ()=>{sidebar.classList.remove('open'); overlay.classList.remove('show');};
  toggle && toggle.addEventListener('click', open);
  close && close.addEventListener('click', shut);
  overlay && overlay.addEventListener('click', shut);
}

/* ---------- Toasts ---------- */
function ensureToastStack(){
  let stack = document.querySelector('.toast-stack');
  if(!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}
function showToast(message, type='success'){
  const stack = ensureToastStack();
  const icons = {success:'fa-circle-check', error:'fa-circle-exclamation', warning:'fa-triangle-exclamation'};
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fa-solid ${icons[type]||icons.success}"></i><span class="msg">${message}</span><button class="close-t"><i class="fa-solid fa-xmark"></i></button>`;
  stack.appendChild(toast);
  toast.querySelector('.close-t').addEventListener('click', ()=> toast.remove());
  setTimeout(()=> toast.remove(), 4500);
}

/* ---------- Spinner ---------- */
function ensureSpinner(){
  let sp = document.querySelector('.spinner-overlay');
  if(!sp){
    sp = document.createElement('div');
    sp.className = 'spinner-overlay';
    sp.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(sp);
  }
  return sp;
}
function showSpinner(){ ensureSpinner().classList.add('show'); }
function hideSpinner(){ ensureSpinner().classList.remove('show'); }
function withSpinner(fn, delay=900){
  showSpinner();
  setTimeout(()=>{ hideSpinner(); fn(); }, delay);
}

/* ---------- Modal helpers ---------- */
function openModal(id){
  const m = document.getElementById(id);
  if(m) m.classList.add('show');
}
function closeModal(id){
  const m = document.getElementById(id);
  if(m) m.classList.remove('show');
}
function initModalDismiss(){
  document.querySelectorAll('.modal-overlay').forEach(ov=>{
    ov.addEventListener('click', e=>{
      if(e.target === ov) ov.classList.remove('show');
    });
  });
  document.querySelectorAll('[data-close-modal]').forEach(btn=>{
    btn.addEventListener('click', ()=> btn.closest('.modal-overlay').classList.remove('show'));
  });
}

/* ---------- Password visibility toggle ---------- */
function initPasswordToggle(){
  document.querySelectorAll('.toggle-pass').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.previousElementSibling;
      const isPass = input.type === 'password';
      input.type = isPass ? 'text' : 'password';
      btn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
    });
  });
}

/* ---------- Simple field validation ---------- */
function setFieldError(group, message){
  group.classList.add('error');
  const err = group.querySelector('.form-error');
  if(err) err.textContent = message;
}
function clearFieldError(group){
  group.classList.remove('error');
}
function validateRequired(form){
  let valid = true;
  form.querySelectorAll('[required]').forEach(input=>{
    const group = input.closest('.form-group') || input.closest('.upload-box') || input.parentElement;
    if(!input.value || (input.type==='checkbox' && !input.checked)){
      valid = false;
      if(group && group.classList.contains('form-group')) setFieldError(group, 'This field is required.');
    } else {
      if(group && group.classList.contains('form-group')) clearFieldError(group);
    }
  });
  return valid;
}

/* ---------- Pagination generator ---------- */
function renderPagination(container, totalItems, perPage, currentPage, onChange){
  container.innerHTML = '';
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  const mk = (label, page, disabled, active)=>{
    const b = document.createElement('button');
    b.textContent = label;
    if(active) b.classList.add('active');
    if(disabled) b.disabled = true;
    b.addEventListener('click', ()=> onChange(page));
    return b;
  };
  container.appendChild(mk('‹', currentPage-1, currentPage===1, false));
  for(let p=1; p<=totalPages; p++){
    container.appendChild(mk(p, p, false, p===currentPage));
  }
  container.appendChild(mk('›', currentPage+1, currentPage===totalPages, false));
}

/* ---------- Current session / portal role ----------
   Each portal (seeker vs employer) must stay fully independent.
   We persist which portal the user is logged into so shared pages
   like messages.html always know the correct portal, instead of
   guessing from document.referrer (which is unreliable — it can be
   blank, cached, or not match, causing a user to land in the wrong
   portal's inbox). */
const CURRENT_ROLE_KEY = 'jobmatch_current_role';
function setCurrentRole(role){
  try{ localStorage.setItem(CURRENT_ROLE_KEY, role); }catch(e){ /* ignore */ }
}
function getCurrentRole(){
  try{ return localStorage.getItem(CURRENT_ROLE_KEY); }catch(e){ return null; }
}
function clearCurrentRole(){
  try{ localStorage.removeItem(CURRENT_ROLE_KEY); }catch(e){ /* ignore */ }
}
/* Auto-clear the session on any "Logout" link so the next login always
   starts fresh and can't leak into the wrong portal. */
function initLogoutLinks(){
  document.querySelectorAll('.side-nav a, .nav-links a').forEach(a=>{
    if(a.textContent.trim().toLowerCase().includes('logout')){
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        clearCurrentRole();
        if(typeof Auth !== 'undefined'){
          Auth.logout().finally(()=> window.location.href = 'login.html');
        } else {
          window.location.href = 'login.html';
        }
      });
    }
  });
}

/* ---------- Topbar mini profile (avatar + name, top-right corner) ---------- */
function renderTopbarUser(displayName, subtitle, photoUrl){
  const avatar = document.getElementById('topbarAvatar');
  const nameEl = document.getElementById('topbarName');
  const subEl = document.getElementById('topbarSubtitle');
  if(avatar){
    if(photoUrl) avatar.innerHTML = `<img src="${photoUrl}" alt="${displayName||''}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">`;
    else avatar.textContent = (displayName||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
  }
  if(nameEl) nameEl.textContent = displayName || '';
  if(subEl && subtitle) subEl.textContent = subtitle;
}

/* ---------- Chat dropdown (topbar) ---------- */
async function renderChatDropdown(){
  const btn = document.getElementById('chatBtn');
  const dropdown = document.getElementById('chatDropdown');
  if(!btn || !dropdown) return;
  if(typeof Auth === 'undefined' || typeof Messaging === 'undefined') return;

  const me = await Auth.currentProfile().catch(()=>null);
  if(!me) return;

  let conversations = [];
  try{
    const rows = await Messaging.listConversations(me.id);
    conversations = await Promise.all(rows.map(async c=>{
      const other = c.participant_a === me.id ? c.b : c.a;
      const msgs = await Messaging.listMessages(c.id);
      const last = msgs[msgs.length-1];
      const unread = msgs.filter(m=>m.sender_id!==me.id && !m.read).length;
      return {id:c.id, other, last, unread};
    }));
  }catch(e){ return; }

  const listEl = dropdown.querySelector('.chat-list-preview');
  const unreadTotal = conversations.reduce((s,c)=>s+c.unread,0);
  const countBadge = dropdown.querySelector('.chat-count');
  if(countBadge) countBadge.textContent = `${unreadTotal} new`;

  listEl.innerHTML = conversations.slice(0,5).map(c=>{
    const initials = (c.other?.name||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    return `<a href="messages.html?id=${c.id}" class="chat-preview-item ${c.unread?'unread':''}">
      <div class="avatar" style="width:38px;height:38px;font-size:.8rem;flex-shrink:0;">${initials}</div>
      <div><p>${c.last ? c.last.text : 'No messages yet'}</p><small>${c.other?.name||''}</small></div>
    </a>`;
  }).join('') || `<div style="padding:16px;text-align:center;color:var(--gray-500);font-size:.85rem;">No conversations yet.</div>`;

  // This function runs more than once per page (once automatically, and
  // again from each page's own init script). Without this guard, every
  // extra call attaches ANOTHER click listener, so opening the dropdown
  // toggles it open-then-closed in the same click and it looks broken.
  if(!btn.dataset.bound){
    btn.dataset.bound = 'true';
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', e=>{
      if(!dropdown.contains(e.target) && e.target !== btn){
        dropdown.classList.remove('show');
      }
    });
  }
}

/* ---------- Notification dropdown ---------- */
async function renderNotifDropdown(){
  const btn = document.getElementById('notifBtn');
  const dropdown = document.getElementById('notifDropdown');
  if(!btn || !dropdown) return;
  if(typeof Auth === 'undefined' || typeof Notifications === 'undefined') return;

  const me = await Auth.currentProfile().catch(()=>null);
  if(!me) return;

  let notifs = [];
  try{ notifs = await Notifications.list(me.id, 4); }catch(e){ return; }

  const listEl = dropdown.querySelector('.notif-list');
  const unreadCount = notifs.filter(n=>!n.read).length;
  const countBadge = dropdown.querySelector('.notif-count');
  if(countBadge) countBadge.textContent = `${unreadCount} new`;

  listEl.innerHTML = notifs.map(n=>`
    <div class="notif-item ${n.read?'':'unread'}">
      <div class="notif-icon"><i class="fa-solid ${n.icon||'fa-bell'}"></i></div>
      <div><p>${n.text}</p><small>${new Date(n.created_at).toLocaleDateString()}</small></div>
    </div>`).join('') || `<div style="padding:16px;text-align:center;color:var(--gray-500);font-size:.85rem;">No notifications yet.</div>`;

  if(!btn.dataset.bound){
    btn.dataset.bound = 'true';
    btn.addEventListener('click', e=>{
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', e=>{
      if(!dropdown.contains(e.target) && e.target !== btn){
        dropdown.classList.remove('show');
      }
    });
  }
}

/* ---------- Active nav link highlighter ---------- */
function highlightActiveLink(){
  const current = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .side-nav a').forEach(a=>{
    const href = a.getAttribute('href');
    if(href === current) a.classList.add('active');
  });
}

/* ---------- Init on every page ---------- */
/* ---------- Supabase configuration banner ---------- */
function renderConfigBanner(){
  if(typeof window.SUPABASE_READY === 'undefined' || window.SUPABASE_READY) return;
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:#B91C1C;color:#fff;' +
    'font:600 13px/1.4 -apple-system,Segoe UI,Roboto,sans-serif;padding:10px 16px;text-align:center;';
  bar.innerHTML = '⚠ Supabase is not connected — open <code style="background:rgba(255,255,255,.2);padding:1px 5px;border-radius:3px;">js/supabase-client.js</code> and paste in your project URL + anon key. Login/register and all data features will not work until then.';
  document.body.prepend(bar);
  document.body.style.paddingTop = (bar.offsetHeight) + 'px';
}

document.addEventListener('DOMContentLoaded', ()=>{
  initNavToggle();
  initSidebar();
  initModalDismiss();
  initPasswordToggle();
  highlightActiveLink();
  renderConfigBanner();
  renderNotifDropdown();
  renderChatDropdown();
  initLogoutLinks();
});
