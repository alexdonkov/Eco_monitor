// ===== Страница „Място“ (Миро) =====
import { t } from '../i18n/i18n.js';
import { colorFor, bandFor } from './colors.js';
import { formatNumber, formatDateTime, indicatorName, escapeHtml } from './format.js';

/**
 * @param loc         ред от locations
 * @param latest      последните стойности за мястото
 * @param indicators  { [id]: indicator }
 */
export function renderLocation(loc, latest, indicators) {
  document.getElementById('locationName').textContent = loc.name;
  document.getElementById('locationMeta').textContent =
    `${Number(loc.latitude).toFixed(3)}°N, ${Number(loc.longitude).toFixed(3)}°E · ${t('location.' + loc.type)}` +
    (loc.description ? ` · ${loc.description}` : '');

  const rows = latest
    .map(m => ({ m, ind: indicators[m.indicator_id] }))
    .filter(r => r.ind)
    .sort((a, b) => a.ind.id - b.ind.id)
    .map(({ m, ind }) => {
      const band = bandFor(ind, m.value);
      return `<tr>
        <td>${escapeHtml(indicatorName(ind))}</td>
        <td><span class="dot" style="background:${colorFor(ind, m.value)}"></span><b>${formatNumber(m.value)}</b> ${escapeHtml(ind.unit)}</td>
        <td>${band ? t(band.key) : '—'}</td>
        <td>${t('source.' + m.source)}${m.verified ? ' ✓' : ''}</td>
        <td class="muted">${formatDateTime(m.measured_at)}</td>
      </tr>`;
    }).join('');

  document.getElementById('locationTable').innerHTML = rows
    ? `<table class="table"><thead><tr>
         <th>${t('location.indicator')}</th><th>${t('location.value')}</th><th>${t('location.quality')}</th>
         <th>${t('location.source')}</th><th>${t('location.time')}</th></tr></thead><tbody>${rows}</tbody></table>`
    : `<p class="muted">${t('map.noData')}</p>`;
}
