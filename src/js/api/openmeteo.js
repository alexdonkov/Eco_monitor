// ===== Open-Meteo Air Quality API (Алекс, Седмица 3) =====
// Документация: https://open-meteo.com/en/docs/air-quality-api
// Данните са МОДЕЛНИ оценки (CAMS), а не измервания — показваме го в интерфейса.

const BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';

/** Строи адреса на заявката за дадено място и брой минали дни. */
export function buildUrl(lat, lon, pastDays = 7) {
  const params = new URLSearchParams({
    latitude: lat, longitude: lon,
    hourly: 'pm2_5,pm10,nitrogen_dioxide,ozone',
    past_days: pastDays, timezone: 'Europe/Sofia',
  });
  return `${BASE}?${params}`;
}

// TODO: fetchAirQuality(lat, lon) — fetch + обработка на грешки (няма мрежа, грешен отговор)
