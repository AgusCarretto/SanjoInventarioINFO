export type NivelAlerta = 'SIN_STOCK' | 'BAJO';

/** Regla de alerta: entra si stock <= mínimo; SIN_STOCK si el stock es 0. */
export function clasificarNivel(
  stockActual: number,
  stockMinimo: number,
): NivelAlerta | null {
  if (stockActual > stockMinimo) return null;
  return stockActual === 0 ? 'SIN_STOCK' : 'BAJO';
}
