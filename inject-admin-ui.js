const fs = require('fs');
let s = fs.readFileSync('app.js','utf8');

if (!/function checkAdmin\(\)/.test(s)) {
  s = s.replace(
    /function postLoginInit\(\)\s*\{([\s\S]*?)\}\s*\n/,
`function postLoginInit(){
  $('#chatInput')?.focus();
  initNav();
  initChat();
  initTickets();
  initKnowledge();
  initWeatherPanel();
  addAssistant(\`Welcome! You're signed in as **\${state.user.email}**. Ask anything IT-related — I can also create tickets if needed.\`);
  // After init, check if admin and enable admin UI if so
  checkAdmin().then(isAdmin => { if (isAdmin) enableAdminUI(); });
}

async function checkAdmin(){
  try{
    const r = await fetch('/api/is_admin?email=' + encodeURIComponent(state.user?.email||'')); 
    const j = await r.json(); 
    return !!j.isAdmin;
  }catch{ return false; }
}

function enableAdminUI(){
  if (document.querySelector('[data-view="admin"]')) return; // avoid dup
  const navBar = document.querySelector('.nav') || document.body;
  const btn = el('button',{className:'nav-btn', 'data-view':'admin'}, 'Admin');
  btn.addEventListener('click', ()=> {
    Array.from(document.querySelectorAll('.view')).forEach(v => v.style.display = (v.id==='adminView')?'block':'none');
    Array.from(document.querySelectorAll('.nav-btn')).forEach(b => b.classList.toggle('active', b===btn));
    loadAdminTickets();
  });
  navBar.appendChild(btn);

  if (!document.querySelector('#adminView')) {
    const adminView = el('div',{id:'adminView', className:'view', style:'display:none;padding:8px;'},
      el('h3',{},'All Tickets (Admin)'),
      el('div',{id:'adminTickets'}, 'Loading...')
    );
    document.querySelector('#mainApp')?.append(adminView);
  }
}

async function loadAdminTickets(){
  const wrap = $('#adminTickets'); if(!wrap) return;
  wrap.textContent = 'Loading...';
  try{
    const r = await fetch('/api/tickets_all?email=' + encodeURIComponent(state.user?.email||''));
    const j = await r.json();
    if (!j.ok) { wrap.textContent = 'Error: ' + (j.error||'unknown'); return; }
    wrap.innerHTML = '';
    j.tickets.forEach(row=>{
      const card = el('div',{className:'ticket'},
        el('h4',{}, row.title),
        el('small',{}, \`\${row.id} • \${new Date(row.created_at).toLocaleString()} • \${row.status} • \${row.user_email}\`),
        el('p',{}, row.details||'')
      );
      wrap.append(card);
    });
    if (!j.tickets.length) wrap.textContent = 'No tickets yet.';
  }catch(e){ wrap.textContent = 'Error: ' + e.message; }
}
`
  );
}

fs.writeFileSync('app.js', s);
