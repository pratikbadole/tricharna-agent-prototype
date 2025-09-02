import { KNOWLEDGE, searchKnowledge } from './knowledge.js';

const AGENT_CONFIG = {
  // Use Edge streaming endpoint
  apiBase: "/api/chat/stream"
};

const state = {
  user: null,
  messages: [],
  tickets: loadTickets()
};

function $(sel){ return document.querySelector(sel); }
function el(tag, attrs={}, ...kids){
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k,v]) => (k in n ? n[k]=v : n.setAttribute(k,v)));
  kids.flat().forEach(k => n.append(k));
  return n;
}
function loadTickets(){
  try { return JSON.parse(localStorage.getItem('tickets_v1')||'[]'); } catch { return []; }
}
function saveTickets(){ localStorage.setItem('tickets_v1', JSON.stringify(state.tickets)); }

function initLogin(){
  const form = $('#loginForm'); const loginScreen = $('#loginScreen'); const mainApp = $('#mainApp');
  form?.addEventListener('submit', (e)=>{
    e.preventDefault();
    const email = $('#email').value.trim();
    const pass = $('#password').value;
    if (email==='john@tricharna.com' && pass==='demo123'){
      state.user = { email };
      loginScreen.style.display = 'none';
      mainApp.style.display = 'block';
      $('#chatInput').focus();
      initNav();
      initChat();
      initTickets();
      initKnowledge();
      initWeatherPanel();
      addAssistant("Welcome! I'm your IT Support Agent. Ask about Wi-Fi, VPN, Outlook, printers, onboarding — I’ll help. I can also create a ticket if needed.");
    } else {
      alert('Invalid credentials (use john@tricharna.com / demo123)');
    }
  });
  $('#logoutBtn')?.addEventListener('click', ()=>{
    state.user = null;
    mainApp.style.display = 'none';
    loginScreen.style.display = 'flex';
  });
}

function initNav(){
  const views = Array.from(document.querySelectorAll('.view'));
  const buttons = Array.from(document.querySelectorAll('.nav-btn'));
  const show = (name)=>{
    views.forEach(v => v.style.display = (v.id === name+'View') ? 'block' : 'none');
    buttons.forEach(b => b.classList.toggle('active', b.dataset.view===name));
  };
  buttons.forEach(b => b.addEventListener('click', ()=> show(b.dataset.view)));
  show('chat');
}

// --- Rendering helpers (Markdown + streaming) ---
function renderMessage(role, html){
  const msg = el('div', { className:'message '+role });
  msg.innerHTML = html;
  $('#chatMessages').append(msg);
  $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  return msg;
}

function md(htmlish){
  // Use CDN-marked if present; else fall back to simple newline -> <br>
  if (window.marked && window.marked.parse) return window.marked.parse(htmlish);
  return (htmlish || '').replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,'<br>');
}

function addUser(text){
  state.messages.push({ role:'user', content:text });
  renderMessage('user', text);
}
function addAssistant(text){
  state.messages.push({ role:'assistant', content:text });
  renderMessage('assistant', md(text));
}
function addAssistantNode(){
  const msg = el('div', { className:'message assistant' });
  $('#chatMessages').append(msg);
  $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
  return msg;
}

function initChat(){
  $('#chatForm')?.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const text = $('#chatInput').value.trim();
    if(!text) return;
    $('#chatInput').value = '';
    addUser(text);
    await respond(text);
  });
}

// --- Local tools (unchanged) ---
function kbSearchTool(q){ return searchKnowledge(q); }
function createTicketTool(payload){
  const id = 'T'+(Date.now().toString(36));
  const ticket = { id, status:'open', createdAt: new Date().toISOString(), ...payload };
  state.tickets.unshift(ticket); saveTickets();
  renderTickets(); 
  return ticket;
}
function updateTicketTool(id, patch){
  const t = state.tickets.find(x=>x.id===id);
  if(!t) return { ok:false, error:'Ticket not found' };
  Object.assign(t, patch); saveTickets(); renderTickets();
  return { ok:true, ticket:t };
}
async function getWeatherTool(city){
  const name = city || ($('#weatherCity')?.value?.trim()) || 'Berlin';
  try{
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`).then(r=>r.json());
    if(!geo?.results?.length) return { ok:false, error:'City not found' };
    const { latitude, longitude, name:place, country } = geo.results[0];
    const w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m`).then(r=>r.json());
    return { ok:true, place:`${place}, ${country}`, temperatureC:w.current?.temperature_2m, windKph:w.current?.wind_speed_10m, code:w.current?.weather_code };
  } catch(e){ return { ok:false, error:e.message }; }
}

// --- Real-time streaming chat ---
async function respond(text){
  if (AGENT_CONFIG.apiBase) {
    try{
      const res = await fetch(AGENT_CONFIG.apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          email: state.user?.email || "guest@demo.com"
        })
      });

      if (!res.body || !res.body.getReader) {
        const fallback = await res.text();
        addAssistant(fallback || "I couldn’t stream a reply.");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      const END_MARK = "<|END_OF_STREAM|>";
      let buffer = "";
      let metaJson = null;
      const node = addAssistantNode();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const endIdx = buffer.indexOf(END_MARK);
        if (endIdx !== -1) {
          // Render final text before end mark
          const textPart = buffer.slice(0, endIdx);
          node.innerHTML = md(textPart);
          // Anything after END_MARK is meta JSON
          const rest = buffer.slice(endIdx + END_MARK.length);
          try { metaJson = JSON.parse(rest.trim()); } catch {}
          break;
        } else {
          node.innerHTML = md(buffer);
        }
        $('#chatMessages').scrollTop = $('#chatMessages').scrollHeight;
      }

      // Execute proposed action AFTER stream finishes (if present)
      if (metaJson && metaJson.proposed_action) {
        const pa = metaJson.proposed_action;
        const ok = window.confirm(`The assistant suggests: ${pa.proposed_action}. Proceed?`);
        if (ok) {
          const execRes = await fetch("/api/execute", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: pa.proposed_action, params: pa.params || {} })
          });
          const execData = await execRes.json();
          if (execData.ok) {
            addAssistant(pa.proposed_action === 'create_ticket'
              ? `✅ Ticket created: ${execData.ticket?.id || '(no id)'}`
              : `✅ Action completed: ${pa.proposed_action}`);
          } else {
            addAssistant(`⚠️ Action failed: ${execData.error || 'Unknown error'}`);
          }
        } else {
          addAssistant("Okay, I won't proceed with that action.");
        }
      }
      return;
    } catch(e){
      addAssistant("⚠️ Error contacting backend: " + e.message + ". Falling back to local tools.");
      // fall through to local demo tools
    }
  }

  // ---- Local fallback demo logic (only if backend fails) ----
  const t = text.toLowerCase();
  if (t.includes('create') && t.includes('ticket')){
    const ticket = createTicketTool({ title: text, category:'general', priority:'normal', description:text });
    addAssistant(`Ticket created: ${ticket.id} — "${ticket.title}". You can view it in Tickets.`);
    return;
  }
  if (t.includes('weather')){
    const cityMatch = text.match(/in ([A-Za-z\s]+)$/i);
    const city = cityMatch ? cityMatch[1].trim() : 'Berlin';
    const w = await getWeatherTool(city);
    if (w.ok){
      $('#weatherOutput').textContent = `${w.place}\nTemp: ${w.temperatureC} °C\nWind: ${w.windKph} km/h`;
      addAssistant(`Current weather for ${w.place}: ${w.temperatureC} °C, wind ${w.windKph} km/h.`);
    } else {
      addAssistant(`Couldn't fetch weather: ${w.error || 'unknown error'}.`);
    }
    return;
  }
  if (t.includes('search') || t.includes('kb') || t.includes('knowledge')){
    const q = text.replace(/^(search|kb|knowledge)/i,'').trim() || text;
    const hits = kbSearchTool(q).slice(0,3);
    if (!hits.length){ addAssistant("No KB results. Try different keywords."); return; }
    const lines = hits.map(h => `• ${h.title} — ${h.category}`);
    addAssistant("Top knowledge matches:\n"+lines.join("\n"));
    return;
  }
  addAssistant("Got it. I can create tickets, search the knowledge base, or fetch weather. Try: “create a ticket to reset VPN”, “weather in Berlin”, or “search VPN drops”."); 
}

// --- Weather/Tickets/Knowledge UI (unchanged) ---
function initWeatherPanel(){
  $('#weatherFetchBtn')?.addEventListener('click', async ()=>{
    const city = $('#weatherCity').value.trim() || 'Berlin';
    const w = await getWeatherTool(city);
    $('#weatherOutput').textContent = w.ok ? `${w.place}\nTemp: ${w.temperatureC} °C\nWind: ${w.windKph} km/h` : (w.error||'Error');
  });
}

function renderTickets(){
  const wrap = $('#ticketsContainer'); wrap.innerHTML = '';
  if(!state.tickets.length){ wrap.append(el('div',{className:'ticket'}, 'No tickets yet.')); return; }
  state.tickets.forEach(t => {
    const card = el('div',{className:'ticket'},
      el('h4',{}, `${t.title}`),
      el('small',{}, `${t.id} • ${new Date(t.createdAt).toLocaleString()} • ${t.status}`),
      el('p',{}, t.description||''),
      el('div',{}, 
        el('button',{className:'btn', onclick:()=>{ updateTicketTool(t.id,{status:'in_progress'}); }}, 'Start'),
        ' ',
        el('button',{className:'btn', onclick:()=>{ updateTicketTool(t.id,{status:'resolved'}); }}, 'Resolve')
      )
    );
    wrap.append(card);
  });
}
function initTickets(){
  $('#createTicketBtn')?.addEventListener('click', ()=>{
    const title = prompt('Ticket title:');
    if(!title) return;
    const desc = prompt('Description (optional):')||'';
    const ticket = createTicketTool({ title, description:desc, category:'general', priority:'normal' });
    addAssistant(`Ticket created: ${ticket.id} — "${ticket.title}".`);
  });
  renderTickets();
}

function renderKnowledge(cat='all', q=''){
  const list = searchKnowledge(q, cat);
  const wrap = $('#knowledgeContainer'); wrap.innerHTML = '';
  if(!list.length){ wrap.append(el('div',{className:'kb-card'},'No results.')); return; }
  list.forEach(it => {
    wrap.append(el('div',{className:'kb-card'},
      el('strong',{}, it.title), el('div',{}, it.category), el('p',{}, it.content)
    ));
  });
}
function initKnowledge(){
  const filters = Array.from(document.querySelectorAll('.filter-btn'));
  let cat = 'all';
  filters.forEach(b => b.addEventListener('click', ()=>{ cat = b.dataset.cat; renderKnowledge(cat, $('#knowledgeSearch').value.trim()); }));
  $('#knowledgeSearch')?.addEventListener('input', (e)=> renderKnowledge(cat, e.target.value.trim()));
  renderKnowledge();
}

(function boot(){ initLogin(); })();
