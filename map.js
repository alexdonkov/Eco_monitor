// ===== Карта с Leaflet (Миро) =====
import { t } from '../i18n/i18n.js';
import { colorFor, BANDS, tempColor } from './colors.js';
import { formatNumber, formatDateTime, indicatorName, escapeHtml } from './format.js';

let map = null;
let markerLayer = null;

/** Създава картата веднъж. Център — България. */
export function initMap(containerId) {
  if (map) return map;
  map = L.map(containerId, { scrollWheelZoom: false }).setView([42.75, 25.3], 7);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  markerLayer = L.layerGroup().addTo(map);
  return map;
}

/**
 * Рисува маркерите.
 * @param locations  места от базата (само outdoor)
 * @param latest     { [location_id]: { value, measured_at, source } }
 * @param indicator  избраният показател (ред от indicators)
 */
export function renderMarkers(locations, latest, indicator) {
  markerLayer.clearLayers();
  locations.forEach(loc => {
    const m = latest[loc.id];
    const value = m?.value ?? null;
    const isClub = m?.source === 'manual';           // квадрат = екоклуб, кръг = модел
    const icon = L.divIcon({
      className: '',
      html: `<div class="marker ${isClub ? 'marker-club' : ''}" style="background:${colorFor(indicator, value)}">${value == null ? '–' : Math.round(value)}</div>`,
      iconSize: [34, 34], iconAnchor: [17, 17],
    });
    const popup = `
      <strong>${escapeHtml(loc.name)}</strong><br>
      ${indicatorName(indicator)}: <b>${formatNumber(value)} ${escapeHtml(indicator.unit)}</b><br>
      <span class="muted">${m ? formatDateTime(m.measured_at) : t('map.noData')} · ${m ? t('source.' + m.source) : ''}</span><br>
      <a href="#location-${loc.id}">${t('map.details')} →</a>`;
    L.marker([loc.latitude, loc.longitude], { icon }).bindPopup(popup).addTo(markerLayer);
  });
}

/** Легенда под картата. */
export function renderLegend(el, indicator) {
  el.innerHTML = indicator.code === 'temperature'
    ? [-5, 5, 12, 20, 30].map(v => `<span><i style="background:${tempColor(v)}"></i>${v} °C</span>`).join('')
    : BANDS.map(b => `<span><i style="background:${b.color}"></i>${t(b.key)}</span>`).join('')
      + `<span><i class="sq"></i>${t('map.clubLegend')}</span>`;
}
