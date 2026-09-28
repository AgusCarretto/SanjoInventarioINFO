const COLUMNAS = [
  'Artículo',
  'Categoría',
  'Tipo',
  'Marca',
  'Modelo',
  'Compatibilidad',
  'A quién le sirve',
  'Uso',
  'Stock actual',
  'Stock mínimo',
  'Faltante',
  'Nivel',
];
const TEXTO_NIVEL = { SIN_STOCK: 'Sin stock', BAJO: 'Stock bajo' };

function celda(valor) {
  const texto = String(valor ?? '');
  return /[;"\r\n]/.test(texto) ? `"${texto.replaceAll('"', '""')}"` : texto;
}

function textoUso(esRetornable) {
  if (esRetornable === true) return 'Retornable';
  if (esRetornable === false) return 'Consumible';
  return '';
}

/**
 * Separador `;` porque Excel en español (Argentina) lo usa como separador de lista.
 * Lleva tipo, marca, modelo y compatibilidad: es lo que hace falta para comprar el repuesto correcto.
 */
export function armarCsvReporteCompra(items) {
  const filas = items.map((i) => [
    i.nombre,
    i.categoria,
    i.tipo,
    i.marca,
    i.modelo,
    i.compatibilidad,
    i.paraQuienes,
    textoUso(i.esRetornable),
    i.stockActual,
    i.stockMinimo,
    i.faltante,
    TEXTO_NIVEL[i.nivel] ?? i.nivel,
  ]);
  return [COLUMNAS, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n');
}

function fechaArchivo(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function nombreArchivoReporte(fecha = new Date()) {
  return `reporte-compra-${fechaArchivo(fecha)}.csv`;
}

const COLUMNAS_BACKUP = [
  'Artículo',
  'Categoría',
  'Tipo',
  'Marca',
  'Modelo',
  'Compatibilidad',
  'A quién le sirve',
  'Uso',
  'Stock actual',
  'Stock mínimo',
];

/** Backup manual: todos los artículos con su stock actual, no solo los que están en alerta. */
export function armarCsvBackupArticulos(items) {
  const filas = items.map((i) => [
    i.nombre,
    i.categoria,
    i.tipo,
    i.marca,
    i.modelo,
    i.compatibilidad,
    i.paraQuienes,
    textoUso(i.esRetornable),
    i.stockActual,
    i.stockMinimo,
  ]);
  return [COLUMNAS_BACKUP, ...filas].map((fila) => fila.map(celda).join(';')).join('\r\n');
}

export function nombreArchivoBackup(fecha = new Date()) {
  return `backup-articulos-${fechaArchivo(fecha)}.csv`;
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
