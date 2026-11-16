// ===== EcoMonitor — входна точка: навигация, език, зареждане на данни =====
import { initI18n, setLanguage, t } from './i18n/i18n.js';
import { initMap, renderMarkers, renderLegend } from './ui/map.js';
import { renderLocation } from './ui/location.js';
import { initAuthForm } from './ui/auth.js';
import { indicatorName, escapeHtml } from './ui/format.js';

const PAGES = ['map', 'location', 'compare', 'ventilation', 'alerts', 'add', 'login'];
const MAP_INDICATORS = ['pm2_5', 'pm10', 'no2', 'temperature'];

let api = null;   // модулът supabase.js — зарежда се динамично, за да работи навигацията и без config.js
const state = {
  page: 'map', param: null,
  indicators: [], indicatorById: {}, locations: [],
  mapIndicator: 'pm2_5', latest: {},
  user: null, profile: null,
};

/* ---------- Помощни ---------- */

export function toast(key) {
  const el = document.getElementById('toast');
  el.textContent = t(key);
  el.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => el.classList.remove('show'), 2800);
}

function showLoadError(err) {
  console.error(err);
  toast('errors.network');
}

/* ---------- Навигация: #map, #alerts, #location-5 ... ---------- */

function parseHash() {
  const [page, param] = (location.hash.slice(1) || 'map').split('-');
  return PAGES.includes(page) ? { page, param } : { page: 'map', param: null };
}

async function showPage() {
  Object.assign(state, parseHash());
  document.querySelectorAll('.page').forEach(s => s.classList.toggle('active', s.id === state.page));
  document.querySelectorAll('#mainNav a').forEach(a => a.classList.toggle('active', a.hash === '#' + state.page));
  document.getElementById('mainNav').classList.remove('open');
  window.scrollTo(0, 0);
  await renderPage();
}

async function renderPage() {
  if (!api) return;
  try {
    if (state.page === 'map') await showMap();
    if (state.page === 'location') await showLocation(Number(state.param));
    if (state.page === 'add') showAddForm();
  } catch (err) { showLoadError(err); }
}

/* ---------- Карта ---------- */

function fillMapSelect() {
  const select = document.getElementById('mapIndicator');
  select.innerHTML = state.indicators
    .filter(i => MAP_INDICATORS.includes(i.code))
    .map(i => `<option value="${i.code}">${escapeHtml(indicatorName(i))}</option>`).join('');
  select.value = state.mapIndicator;
}

async function showMap() {
  const map = initMap('mapContainer');
  setTimeout(() => map.invalidateSize(), 0);      // Leaflet трябва да знае размера след показване
  const rows = await api.getLatestByIndicator(state.mapIndicator);
  state.latest = Object.fromEntries(rows.map(r => [r.location_id, r]));
  drawMap();
}

function drawMap() {
  const indicator = state.indicators.find(i => i.code === state.mapIndicator);
  if (!indicator) return;
  const outdoor = state.locations.filter(l => l.type === 'outdoor');
  renderMarkers(outdoor, state.latest, indicator);
  renderLegend(document.getElementById('mapLegend'), indicator);
}

document.getElementById('mapIndicator').addEventListener('change', e => {
  state.mapIndicator = e.target.value;
  showMap().catch(showLoadError);
});

/* ---------- Място ---------- */

async function showLocation(id) {
  const [loc, latest] = await Promise.all([api.getLocation(id), api.getLatestForLocation(id)]);
  state.currentLocation = { loc, latest };
  renderLocation(loc, latest, state.indicatorById);
}

/* ---------- Добави измерване (записът — Седмица 3) ---------- */

function showAddForm() {
  document.getElementById('addNeedLogin').hidden = !!state.user;
  document.getElementById('measurementForm').hidden = !state.user;
  document.getElementById('addLocation').innerHTML =
    state.locations.map(l => `<option value="${l.id}">${escapeHtml(l.name)}</option>`).join('');
  document.getElementById('addIndicator').innerHTML =
    state.indicators.map(i => `<option value="${i.id}">${escapeHtml(indicatorName(i))} (${escapeHtml(i.unit)})</option>`).join('');
}

/* ---------- Вход / изход ---------- */

function renderAuthArea() {
  const el = document.getElementById('authArea');
  if (!state.user) {
    el.innerHTML = `<a href="#login" class="login">${t('nav.login')}</a>`;
    return;
  }
  const name = state.profile?.display_name ?? state.user.email;
  const role = state.profile?.role === 'leader' ? `<span class="role">${t('auth.leader')}</span>` : '';
  el.innerHTML = `<span class="user">${escapeHtml(name)}</span>${role}<button id="logoutBtn" class="link-btn">${t('nav.logout')}</button>`;
  document.getElementById('logoutBtn').onclick = async () => {
    try { await api.signOut(); toast('auth.loggedOut'); } catch (err) { showLoadError(err); }
  };
}

async function handleAuthChange(user) {
  state.user = user;
  state.profile = null;
  if (user) {
    try { state.profile = await api.getProfile(user.id); } catch (err) { console.warn('Няма профил', err); }
  }
  renderAuthArea();
  if (state.page === 'add') showAddForm();
}

/* ---------- Език ---------- */

document.querySelectorAll('.lang button').forEach(btn =>
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

// При смяна на езика пренаписваме само текстовете — избраната страница, показател и въведените данни остават.
document.addEventListener('languagechange', () => {
  renderAuthArea();
  if (!api || !state.indicators.length) return;
  fillMapSelect();
  if (state.page === 'map') drawMap();
  if (state.page === 'location' && state.currentLocation) renderLocation(state.currentLocation.loc, state.currentLocation.latest, state.indicatorById);
  if (state.page === 'add') {
    const form = document.getElementById('measurementForm');
    const keep = { location: form.location.value, indicator: form.indicator.value };
    showAddForm();
    form.location.value = keep.location; form.indicator.value = keep.indicator;
  }
});

document.getElementById('menuBtn').addEventListener('click', () => document.getElementById('mainNav').classList.toggle('open'));
window.addEventListener('hashchange', showPage);

/* ---------- Старт ---------- */

async function start() {
  initI18n();
  renderAuthArea();
  try {
    api = await import('./api/supabase.js');
  } catch (err) {
    console.error(err);
    document.getElementById('configBanner').hidden = false;   // липсва config.js или няма интернет
    showPage();
    return;
  }
  try {
    [state.indicators, state.locations] = await Promise.all([api.getIndicators(), api.getLocations()]);
    state.indicatorById = Object.fromEntries(state.indicators.map(i => [i.id, i]));
    fillMapSelect();
  } catch (err) { showLoadError(err); }

  initAuthForm(api, () => { location.hash = '#map'; }, toast);
  api.onAuthChange(handleAuthChange);
  showPage();
}

start();
