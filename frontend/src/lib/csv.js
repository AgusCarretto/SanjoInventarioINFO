const COLUMNAS = ['Artículo', 'Categoría', 'Tipo', 'Stock actual', 'Stock mínimo', 'Faltante', 'Nivel'];
const TEXTO_NIVEL = { SIN_STOCK: 'Sin stock', BAJO: 'Stock bajo' };

function celda(valor) {
  const texto = String(valor);
  return /[;"\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

/** Separador `;` porque Excel en español (Argentina) lo usa como separador de lista. */
export function armarCsvReporteCompra(items) {
  const filas = items.map((i) => [
    i.nombre,
    i.categoria,
    i.esRetornable ? 'Retornable' : 'Consumible',
    i.stockActual,
    i.stockMinimo,
    i.faltante,
    TEXTO_NIVEL[i.nivel] ?? i.nivel,
  ]);
  return [COLUMNAS, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n');
}

export function nombreArchivoReporte(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `reporte-compra-${anio}-${mes}-${dia}.csv`;
}

/** El BOM UTF-8 hace que Excel muestre bien los acentos. */
export function descargarCsv(nombreArchivo, contenido) {
  const blob = new Blob(['﻿', contenido], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  URL.revokeObjectURL(url);
}
