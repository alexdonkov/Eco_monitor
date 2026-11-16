// ===== Форматиране според езика (Миро) =====
import { getLanguage } from '../i18n/i18n.js';

const locale = () => (getLanguage() === 'bg' ? 'bg-BG' : 'en-GB');

/** 12.3 → „12,3“ (BG) или „12.3“ (EN). */
export function formatNumber(n, digits = 1) {
  if (n == null || Number.isNaN(Number(n))) return '—';
  return Number(n).toLocaleString(locale(), { maximumFractionDigits: digits });
}

/** Дата и час на избрания език. */
export function formatDateTime(iso) {
  return new Date(iso).toLocaleString(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/** Име на показател на избрания език (от колоните name_bg / name_en). */
export function indicatorName(indicator) {
  return getLanguage() === 'bg' ? indicator.name_bg : indicator.name_en;
}

/** Защита срещу XSS: текст от базата никога не се вмъква като HTML без това. */
export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
