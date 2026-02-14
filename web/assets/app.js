import { applyI18n } from './i18n.js';

const state = {
  api: localStorage.getItem('tg_api') || 'http://localhost:8787',
  lang: localStorage.getItem('tg_lang') || 'en',
  token: localStorage.getItem('tg_token') || '', // Supabase JWT or your own
  region: localStorage.getItem('tg_region') || 'GLOBAL',
  category: localStorage.getItem('tg_category') || 'all',
  source: localStorage.getItem('tg_source') || 'all',
  plan: localStorage.getItem('tg_plan') || 'free' // UX only. Server enforces.
};

const $ = (s)=>document.querySelector(s);

function toast(msg,t='info'){
  const wrap = $('#toasts');
  const el = document.createElement('div');
  el.className = `toast glass ${t==='warn'?'': ''}`;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(()=>el.remove(), 3500);
}

function headers(){
  const h = { 'Content-Type':'application/json', 'X-Lang': state.lang };
  if(state.token) h['Authorization'] = `Bearer ${state.token}`;
  return h;
}

function setLang(lang){
  state.lang = lang;
  localStorage.setItem('tg_lang', lang);
  applyI18n(lang);
  load();
}

async function apiGet(path){
  const res = await fetch(`${state.api}${path}`, { headers: headers() });
  if(!res.ok) throw new Error(await res.text());
  return res.json();
}

function trendCard(t){
  const locked = t.locked && state.plan !== 'pro';
  return `
    <div class="glass card ${locked?'lock':''}">
      <div style="display:flex;justify-content:space-between;gap:12px">
        <div>
          <div class="badge">${t.category} • ${t.region}</div>
          <div style="font-size:18px;font-weight:800;margin-top:6px">${t.term}</div>
          <div style="margin-top:8px;color:#cbd5e1;font-size:13px">${t.summary || ''}</div>
          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">${(t.sources||[]).map(s=>`<span class="badge">${s}</span>`).join('')}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:30px;font-weight:900;color:#34d399">${t.momentum}%</div>
          <div style="font-size:12px;color:#94a3b8">Momentum</div>
          <div style="margin-top:8px;font-weight:800;color:#86efac">${t.velocity}</div>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btnGhost" data-open="${t.id}">${document.querySelector('[data-i18n="details"]').textContent}</button>
        ${locked?`<span class="badge" style="border-color:rgba(245,158,11,.5);color:#fbbf24">🔒 ${document.querySelector('[data-i18n="proRequired"]').textContent}</span>`:''}
      </div>
    </div>
  `;
}

async function load(){
  // filters
  state.region = $('#region').value;
  state.category = $('#category').value;
  state.source = $('#source').value;
  localStorage.setItem('tg_region', state.region);
  localStorage.setItem('tg_category', state.category);
  localStorage.setItem('tg_source', state.source);

  const qs = new URLSearchParams({ region: state.region, category: state.category, source: state.source, limit: '12' }).toString();
  try{
    const data = await apiGet(`/api/trends?${qs}`);
    $('#updatedAt').textContent = data.lastUpdate ? new Date(data.lastUpdate).toLocaleString() : '-';
    $('#grid').innerHTML = (data.trends||[]).map(trendCard).join('');
  }catch(e){
    toast('API error. Is the server running?', 'warn');
  }
}

async function openTrend(id){
  try{
    const data = await apiGet(`/api/trends/${encodeURIComponent(id)}`);
    // Simple modal
    $('#modalTitle').textContent = data.term;
    $('#modalBody').innerHTML = `
      <p><b>Region:</b> ${data.region} &nbsp; <b>Category:</b> ${data.category}</p>
      <p><b>Momentum:</b> ${data.momentum}% &nbsp; <b>Velocity:</b> ${data.velocity}</p>
      <p style="margin-top:10px"><b>AI explanation:</b> ${data.ai?.why || data.summary || ''}</p>
      <div style="margin-top:10px"><b>Ideas:</b><ul>${(data.ai?.ideas||[]).map(x=>`<li>${x}</li>`).join('')}</ul></div>
      <div style="margin-top:10px"><b>Sources:</b> ${(data.sources||[]).join(', ')}</div>
      <p style="margin-top:14px"><small>${document.querySelector('[data-i18n="disclaimerShort"]').textContent}</small></p>
    `;
    $('#modal').style.display = 'block';
  }catch(e){
    toast('Locked or not found. Upgrade for details.', 'warn');
  }
}

function init(){
  // i18n
  $('#lang').value = state.lang;
  applyI18n(state.lang);

  $('#lang').addEventListener('change', ()=> setLang($('#lang').value));
  $('#region').value = state.region;
  $('#category').value = state.category;
  $('#source').value = state.source;

  $('#region').addEventListener('change', load);
  $('#category').addEventListener('change', load);
  $('#source').addEventListener('change', load);

  // Pricing buttons are placeholders. Server-side Stripe in /api/billing.
  $('#btnPro').addEventListener('click', async ()=>{
    toast('Stripe checkout must be wired. See server README.', 'warn');
  });

  // modal
  $('#closeModal').addEventListener('click', ()=> $('#modal').style.display='none');
  $('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') $('#modal').style.display='none'; });

  // delegated open
  document.body.addEventListener('click', (e)=>{
    const btn = e.target.closest('[data-open]');
    if(btn) openTrend(btn.dataset.open);
  });

  load();
}

document.addEventListener('DOMContentLoaded', init);
