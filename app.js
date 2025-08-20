import { KNOWLEDGE, searchKnowledge } from './knowledge.js';
import { marked } from "https://cdn.jsdelivr.net/npm/marked/+esm";
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
  try { return marked.parse(htmlish || ""); } catch { return (htmlish || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\n/g,"<br>"); }
}
