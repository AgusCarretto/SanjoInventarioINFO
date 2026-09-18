/** Ancho de la barra de stock: stock actual respecto del mínimo, entre 0 y 100. */
export function porcentajeStock(stockActual, stockMinimo) {
  if (stockMinimo <= 0) return 0;
  return Math.min(100, Math.round((stockActual / stockMinimo) * 100));
}
