/**
 * Redondea un monto monetario a 2 decimales evitando imprecisiones de punto flotante.
 */
export function roundMoney(value: number): number {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}
