import { describe, expect, it } from 'vitest';
import { armarCsvReporteCompra, nombreArchivoReporte } from './csv.js';

const item = (extra = {}) => ({
  nombre: 'Cable HDMI 2 m',
  categoria: 'Cables',
  esRetornable: false,
  stockActual: 3,
  stockMinimo: 5,
  faltante: 2,
  nivel: 'BAJO',
  ...extra,
});

describe('armarCsvReporteCompra', () => {
  it('arma encabezado y filas con ; y saltos CRLF', () => {
    expect(armarCsvReporteCompra([item()])).toBe(
      'Artículo;Categoría;Tipo;Stock actual;Stock mínimo;Faltante;Nivel\r\n' +
        'Cable HDMI 2 m;Cables;Consumible;3;5;2;Stock bajo',
    );
  });
  it('traduce tipo y nivel', () => {
    const csv = armarCsvReporteCompra([
      item({ esRetornable: true, nivel: 'SIN_STOCK', stockActual: 0, faltante: 5 }),
    ]);
    expect(csv).toContain('Retornable');
    expect(csv).toContain('Sin stock');
  });
  it('escapa punto y coma y comillas', () => {
    const csv = armarCsvReporteCompra([item({ nombre: 'Cable "HDMI"; 2 m' })]);
    expect(csv).toContain('"Cable ""HDMI""; 2 m"');
  });
  it('sin ítems devuelve solo el encabezado', () => {
    expect(armarCsvReporteCompra([])).toBe(
      'Artículo;Categoría;Tipo;Stock actual;Stock mínimo;Faltante;Nivel',
    );
  });
});

describe('nombreArchivoReporte', () => {
  it('usa la fecha local con ceros', () => {
    expect(nombreArchivoReporte(new Date(2026, 8, 5))).toBe('reporte-compra-2026-09-05.csv');
  });
});
