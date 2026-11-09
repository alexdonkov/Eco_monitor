// ===== Откриване на аномалии (Алекс, Седмица 3–4) =====
// Метод: модифициран z-резултат (Iglewicz & Hoaglin) върху отклонението
// от базовата линия за същия час през предходните 7 дни.
// Виж docs/RESEARCH.md, т. 6.

/**
 * @param {number[]} values  стойности по час, подредени по време
 * @param {object} options   { days: 7, window: 72, threshold: 5, minDiff: 0 }
 * @returns {{index:number, z:number, base:number, value:number}[]}
 * Гранични случаи: < 3 дни история, MAD = 0, празен масив.
 */
export function detectAnomalies(values, options = {}) {
  // TODO
}

/** Индексите, в които стойността ПРЕМИНАВА прага нагоре. */
export function thresholdCrossings(values, threshold) {
  // TODO
}
