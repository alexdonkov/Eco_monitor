// ===== Цветове според качеството (Миро) =====
// Праговете идват от таблицата indicators (warning_level, danger_level).

export const BANDS = [
  { key: 'bands.veryGood', color: '#2f9e5b' },
  { key: 'bands.good',     color: '#9cc33b' },
  { key: 'bands.moderate', color: '#f0b429' },
  { key: 'bands.bad',      color: '#e2602f' },
  { key: 'bands.veryBad',  color: '#b8323f' },
];

/** Връща категорията за стойност. null, ако показателят няма прагове (напр. температура). */
export function bandFor(indicator, value) {
  const warn = indicator.warning_level, danger = indicator.danger_level;
  if (warn == null || danger == null || value == null) return null;
  if (value < warn * 0.5) return BANDS[0];
  if (value < warn)       return BANDS[1];
  if (value < danger)     return BANDS[2];
  if (value < danger * 2) return BANDS[3];
  return BANDS[4];
}

/** Цвят за температура: синьо (студено) → зелено → червено (горещо). */
export function tempColor(v) {
  const stops = [[-5, [63, 111, 216]], [5, [91, 178, 214]], [12, [156, 195, 59]], [20, [240, 180, 41]], [30, [226, 96, 47]]];
  if (v <= stops[0][0]) return `rgb(${stops[0][1]})`;
  for (let i = 1; i < stops.length; i++) {
    if (v <= stops[i][0]) {
      const [a, ca] = stops[i - 1], [b, cb] = stops[i], f = (v - a) / (b - a);
      return `rgb(${ca.map((c, j) => Math.round(c + (cb[j] - c) * f)).join(',')})`;
    }
  }
  return `rgb(${stops.at(-1)[1]})`;
}

export function colorFor(indicator, value) {
  if (value == null) return '#9aa8a1';
  if (indicator.code === 'temperature') return tempColor(value);
  return bandFor(indicator, value)?.color ?? '#5d6f66';
}
