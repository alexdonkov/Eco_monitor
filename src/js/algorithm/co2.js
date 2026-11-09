// ===== Треньор за проветряване — масов баланс на CO₂ (Алекс, Седмица 4) =====
// dC/dt = N·G/V − λ·(C − Cout)
// C(t)  = Cs + (C0 − Cs)·e^(−λt),   Cs = Cout + N·G/(λ·V)

export const WINDOW_ACH = { closed: 0.7, tilted: 2.5, open: 6 };  // обмена на въздух за час

/**
 * @param {{people:number, volume:number, c0:number, ach:number, cOut?:number}} room
 * @returns {{steady:number, at:(minutes:number)=>number, minutesTo:(limit:number)=>number}}
 * minutesTo връща Infinity, ако границата никога не се достига.
 */
export function co2Model(room) {
  // TODO
}
