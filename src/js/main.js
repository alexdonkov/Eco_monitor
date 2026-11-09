// ===== EcoMonitor — входна точка: навигация и език =====
import { initI18n, setLanguage, t } from './i18n/i18n.js';

const PAGES = ['map', 'location', 'compare', 'ventilation', 'alerts', 'add', 'login'];

/** Показва страницата от адреса (#map, #alerts ...). */
function showPage() {
  const id = location.hash.slice(1) || 'map';
  const page = PAGES.includes(id) ? id : 'map';
  document.querySelectorAll('.page').forEach(s => s.classList.toggle('active', s.id === page));
  document.querySelectorAll('.topbar nav a').forEach(a => a.classList.toggle('active', a.hash === '#' + page));
  // TODO: при отваряне на страница — зареди данните ѝ (карта, сигнали ...)
}

/** Кратко съобщение долу на екрана. */
export function toast(key) {
  const el = document.getElementById('toast');
  el.textContent = t(key);
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

document.querySelectorAll('.lang button').forEach(btn =>
  btn.addEventListener('click', () => setLanguage(btn.dataset.lang)));

window.addEventListener('hashchange', showPage);

initI18n();
showPage();
