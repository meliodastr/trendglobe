// TrendGlobe Global MVP (static frontend)
// Replace mock data + placeholders with real API calls.

const state = {
  plan: localStorage.getItem('tg_plan') || 'free', // free | pro | elite
  votesToday: parseInt(localStorage.getItem('tg_votes_today') || '0', 10),
  openedToday: parseInt(localStorage.getItem('tg_opened_today') || '0', 10),
  cardsToday: parseInt(localStorage.getItem('tg_cards_today') || '0', 10),
  filter: 'all',
  lang: localStorage.getItem('tg_lang') || 'en',
  currency: localStorage.getItem('tg_currency') || 'USD'
};

// --- Mock trends. Replace with fetch('/api/trends?lang=...') ---
const MOCK_TRENDS = [
  { id: 't1', term: 'Open-source AI agents', category: 'tech', momentum: 92, velocity: '+180%', sources: ['reddit', 'youtube'], locked: false },
  { id: 't2', term: 'Micro-collectibles', category: 'culture', momentum: 86, velocity: '+140%', sources: ['tiktok'], locked: false },
  { id: 't3', term: 'Women\'s cricket highlights', category: 'sports', momentum: 84, velocity: '+120%', sources: ['youtube'], locked: false },
  { id: 't4', term: 'AI wallet security', category: 'finance', momentum: 81, velocity: '+110%', sources: ['x', 'reddit'], locked: true },
  { id: 't5', term: 'Protein dessert bowls', category: 'culture', momentum: 78, velocity: '+95%', sources: ['tiktok'], locked: true },
  { id: 't6', term: 'On-device translation earbuds', category: 'tech', momentum: 77, velocity: '+90%', sources: ['youtube'], locked: true }
];

// --- Utilities ---
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function toast(msg, tone='info') {
  const box = document.createElement('div');
  const colors = {
    info: 'border-slate-700',
    ok: 'border-emerald-500/40',
    warn: 'border-amber-500/40',
    err: 'border-red-500/40'
  };
  box.className = `glass border ${colors[tone] || colors.info} px-4 py-3 rounded-xl text-sm shadow-2xl`;
  box.textContent = msg;
  $('#toast').appendChild(box);
  setTimeout(() => box.remove(), 3500);
}

function isPro() { return state.plan === 'pro' || state.plan === 'elite'; }
function isElite() { return state.plan === 'elite'; }

function saveDaily() {
  localStorage.setItem('tg_votes_today', String(state.votesToday));
  localStorage.setItem('tg_opened_today', String(state.openedToday));
  localStorage.setItem('tg_cards_today', String(state.cardsToday));
}

// Reset daily counters (simple local day check)
(function dailyReset(){
  const key = 'tg_day';
  const today = new Date().toISOString().slice(0,10);
  const last = localStorage.getItem(key);
  if (last !== today) {
    state.votesToday = 0;
    state.openedToday = 0;
    state.cardsToday = 0;
    localStorage.setItem(key, today);
    saveDaily();
  }
})();

// --- Rendering ---
function renderPlan() {
  $('#planLabel').textContent = state.plan.toUpperCase();
  $('#votesToday').textContent = state.votesToday;
}

function trendRow(t) {
  const locked = t.locked && !isPro();
  const sources = t.sources.map(s => `<span class="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">${s}</span>`).join(' ');
  return `
    <button class="w-full text-left p-3 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-primary/50 transition ${locked ? 'lock' : ''}" data-open="${t.id}">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="font-semibold">${t.term}</div>
          <div class="mt-1 text-xs text-slate-400">${t.category} • <span class="text-success font-semibold">${t.velocity}</span></div>
          <div class="mt-2 flex flex-wrap gap-1">${sources}</div>
        </div>
        <div class="text-right">
          <div class="text-2xl font-extrabold text-success">${t.momentum}<span class="text-base">%</span></div>
          <div class="text-[11px] text-slate-500">Momentum</div>
        </div>
      </div>
      ${locked ? `<div class="mt-2 text-[11px] text-amber-300">🔒 Pro required</div>` : ``}
    </button>
  `;
}

function renderHeroList() {
  const list = $('#trendList');
  const visible = MOCK_TRENDS
    .filter(t => state.filter === 'all' ? true : t.category === state.filter)
    .slice(0, 5);
  list.innerHTML = visible.map(trendRow).join('');
}

function arenaCard(t) {
  const locked = t.locked && !isPro();
  return `
    <div class="glass rounded-3xl p-5 border border-slate-800 hover:border-primary/50 transition ${locked ? 'lock' : ''}">
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs uppercase tracking-wider text-primary font-semibold">${t.category}</div>
          <div class="mt-1 text-lg font-extrabold">${t.term}</div>
        </div>
        <div class="text-right">
          <div class="text-3xl font-extrabold text-success">${t.momentum}%</div>
          <div class="text-[11px] text-slate-500">Momentum</div>
        </div>
      </div>
      <div class="mt-4 flex items-center justify-between text-sm">
        <span class="text-slate-400">Velocity</span>
        <span class="text-success font-bold">${t.velocity}</span>
      </div>
      <div class="mt-3 h-2 bg-slate-900 rounded-full overflow-hidden">
        <div class="h-full bg-gradient-to-r from-primary to-secondary" style="width:${t.momentum}%"></div>
      </div>
      <div class="mt-4 flex gap-2">
        <button class="flex-1 py-2.5 rounded-2xl bg-primary/15 border border-primary/30 text-primary font-semibold" data-vote="${t.id}">Vote +1</button>
        <button class="px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800" data-open="${t.id}">Details</button>
      </div>
      ${locked ? `<div class="mt-3 text-[11px] text-amber-300">🔒 Upgrade to view full details & alerts</div>` : ``}
    </div>
  `;
}

function renderArena() {
  const grid = $('#arenaGrid');
  const items = MOCK_TRENDS.filter(t => state.filter === 'all' ? true : t.category === state.filter);
  grid.innerHTML = items.map(arenaCard).join('');
}

// --- Interaction ---
function applyFilter(category) {
  state.filter = category;
  renderHeroList();
  renderArena();
}

function openTrend(id) {
  const t = MOCK_TRENDS.find(x => x.id === id);
  if (!t) return;

  if (t.locked && !isPro()) {
    toast('This trend detail is for Pro. Upgrade to unlock.', 'warn');
    return;
  }

  // Free daily limit
  if (!isPro() && state.openedToday >= 1) {
    toast('Free limit reached: 1 detail/day. Upgrade for unlimited.', 'warn');
    return;
  }

  state.openedToday += 1;
  saveDaily();
  toast(`Opened: ${t.term}`, 'ok');

  // In real app: route to /trend/:id
  alert(`Trend detail (MVP)\n\n${t.term}\nCategory: ${t.category}\nMomentum: ${t.momentum}%\nVelocity: ${t.velocity}\nSources: ${t.sources.join(', ')}\n\nTODO: Replace with real detail page.`);
}

function voteTrend(id) {
  // Simple anti-abuse: max 20 votes/day for free
  const limit = isPro() ? 200 : 20;
  if (state.votesToday >= limit) {
    toast('Daily vote limit reached.', 'warn');
    return;
  }
  state.votesToday += 1;
  saveDaily();
  renderPlan();
  toast('Vote recorded ✅', 'ok');

  // TODO: POST /api/vote {trendId}
}

function setPlan(plan) {
  state.plan = plan;
  localStorage.setItem('tg_plan', plan);
  renderPlan();
  renderHeroList();
  renderArena();
}

function setCurrency(cur) {
  state.currency = cur;
  localStorage.setItem('tg_currency', cur);
  // Simple price display. Replace with Stripe Prices.
  const map = {
    USD: { pro: '$29', elite: '$99' },
    EUR: { pro: '€27', elite: '€92' },
    GBP: { pro: '£24', elite: '£85' }
  };
  const p = map[cur] || map.USD;
  $('#proPrice').textContent = p.pro;
  $('#elitePrice').textContent = p.elite;
}

// Shareable card link (placeholder)
function generateCard() {
  const limit = isPro() ? 999 : 1;
  if (state.cardsToday >= limit) {
    toast('Free limit reached: 1 card/day. Upgrade for more.', 'warn');
    return;
  }
  state.cardsToday += 1;
  saveDaily();
  const rnd = Math.random().toString(36).slice(2, 10);
  const url = `https://trendglobe.example/card/${rnd}`;
  $('#cardLink').value = url;
  toast('Card link generated', 'ok');
}

async function copyToClipboard(value) {
  try {
    await navigator.clipboard.writeText(value);
    toast('Copied!', 'ok');
  } catch {
    toast('Copy failed. Please copy manually.', 'err');
  }
}

// Countdown (15 minutes)
(function countdown(){
  let sec = 15 * 60;
  setInterval(() => {
    sec = Math.max(0, sec - 1);
    const mm = String(Math.floor(sec/60)).padStart(2,'0');
    const ss = String(sec%60).padStart(2,'0');
    $('#countdown').textContent = `00:${mm}:${ss}`;
    if (sec === 0) sec = 15 * 60; // placeholder refresh cycle
  }, 1000);
})();

// --- Init ---
function init() {
  // i18n
  const langSel = $('#lang');
  langSel.value = state.lang;
  window.TG_I18N.setLanguage(state.lang);
  langSel.addEventListener('change', () => {
    state.lang = langSel.value;
    window.TG_I18N.setLanguage(state.lang);
  });

  // theme
  const themeBtn = $('#themeBtn');
  const savedDark = localStorage.getItem('tg_dark');
  const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = savedDark ? savedDark === '1' : prefers;
  document.documentElement.classList.toggle('dark', dark);
  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('tg_dark', isDark ? '1' : '0');
  });

  // filters
  $$('button[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => applyFilter(btn.dataset.filter));
  });

  // delegated clicks
  document.body.addEventListener('click', (e) => {
    const openBtn = e.target.closest('[data-open]');
    const voteBtn = e.target.closest('[data-vote]');
    if (openBtn) openTrend(openBtn.dataset.open);
    if (voteBtn) voteTrend(voteBtn.dataset.vote);
  });

  // pricing actions
  $('#chooseFree').addEventListener('click', () => { setPlan('free'); toast('You are on Free plan', 'ok'); });
  $('#buyPro').addEventListener('click', () => {
    // TODO: redirect to Stripe checkout
    toast('Stripe checkout placeholder. Wire this to your Stripe link.', 'warn');
    setPlan('pro');
  });
  $('#contactSales').addEventListener('click', () => {
    window.location.href = 'mailto:sales@trendglobe.example?subject=Elite%20Plan%20Inquiry';
  });

  // currency
  $('#currency').value = state.currency;
  setCurrency(state.currency);
  $('#currency').addEventListener('change', () => setCurrency($('#currency').value));

  // shareable card
  $('#generateCard').addEventListener('click', generateCard);
  $('#copyCard').addEventListener('click', () => copyToClipboard($('#cardLink').value || ''));

  // login placeholder
  $('#loginBtn').addEventListener('click', () => toast('Auth not wired yet. Add Supabase/Clerk.', 'warn'));
  $('#ctaStart').addEventListener('click', () => {
    toast('Welcome! Try opening a trend detail.', 'ok');
    window.scrollTo({ top: document.querySelector('#trendList').offsetTop - 60, behavior: 'smooth' });
  });

  renderPlan();
  renderHeroList();
  renderArena();
}

document.addEventListener('DOMContentLoaded', init);
