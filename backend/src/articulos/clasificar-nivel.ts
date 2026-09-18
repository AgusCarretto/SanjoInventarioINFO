export type NivelAlerta = 'SIN_STOCK' | 'BAJO';

/**
 * Regla de alerta: entra si stock <= mínimo; SIN_STOCK si el stock es 0.
 * Sin stock actual o sin mínimo cargado no hay con qué comparar: no hay alerta.
 */
export function clasificarNivel(
  stockActual: number | null,
  stockMinimo: number | null,
): NivelAlerta | null {
  if (stockActual === null || stockMinimo === null) return null;
  if (stockActual > stockMinimo) return null;
  return stockActual === 0 ? 'SIN_STOCK' : 'BAJO';
}
