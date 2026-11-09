// ===== Система за преводи =====
// Текстовете са в bg.js и en.js. В HTML: <span data-i18n="nav.map"></span>
// Смяната на езика само пренаписва текстовете — въведените данни остават.
import bg from './bg.js';
import en from './en.js';

const DICTS = { bg, en };
let lang = 'bg';

/** Връща превода за ключ като "nav.map"; {name} се заменя с vars.name. */
export function t(key, vars = {}) {
  const text = key.split('.').reduce((obj, k) => obj?.[k], DICTS[lang]) ?? key;
  return text.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function getLanguage() { return lang; }

/** Сменя езика и обновява всички елементи с data-i18n. */
export function setLanguage(newLang) {
  if (!DICTS[newLang]) return;
  lang = newLang;
  try { localStorage.setItem('eco_lang', lang); } catch (e) { /* може да липсва */ }
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  document.querySelectorAll('.lang button').forEach(b => b.classList.toggle('active', b.dataset.lang === lang));
  document.dispatchEvent(new CustomEvent('languagechange', { detail: lang }));  // графиките/картата слушат това
}

/** Български по подразбиране; помни последния избор. */
export function initI18n() {
  let saved = 'bg';
  try { saved = localStorage.getItem('eco_lang') || 'bg'; } catch (e) { /* може да липсва */ }
  setLanguage(saved);
}
