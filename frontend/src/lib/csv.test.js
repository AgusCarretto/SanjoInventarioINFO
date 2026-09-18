import { describe, expect, it } from 'vitest';
import { armarCsvReporteCompra, nombreArchivoReporte } from './csv.js';

const item = (extra = {}) => ({
  nombre: 'Cable HDMI 2 m',
  categoria: 'Otros',
  tipo: 'Cable de video',
  marca: null,
  modelo: null,
  compatibilidad: null,
  esRetornable: false,
  stockActual: 3,
  stockMinimo: 5,
  faltante: 2,
  nivel: 'BAJO',
  ...extra,
});

const ENCABEZADO = 'Artículo;Categoría;Tipo;Marca;Modelo;Compatibilidad;Uso;Stock actual;Stock mínimo;Faltante;Nivel';

describe('armarCsvReporteCompra', () => {
  it('arma encabezado y filas con ; y saltos CRLF', () => {
    expect(armarCsvReporteCompra([item()])).toBe(
      `${ENCABEZADO}\r\nCable HDMI 2 m;Otros;Cable de video;;;;Consumible;3;5;2;Stock bajo`,
    );
  });

  it('incluye tipo, marca, modelo y compatibilidad para saber qué comprar', () => {
    const csv = armarCsvReporteCompra([
      item({
        nombre: 'Tóner HP 26A',
        categoria: 'Impresoras',
        tipo: 'Tóner',
        marca: 'HP',
        modelo: '26A',
        compatibilidad: 'LaserJet Pro M402',
      }),
    ]);
    expect(csv).toContain('Tóner HP 26A;Impresoras;Tóner;HP;26A;LaserJet Pro M402;Consumible');
  });

  it('traduce el uso y el nivel', () => {
    const csv = armarCsvReporteCompra([
      item({ esRetornable: true, nivel: 'SIN_STOCK', stockActual: 0, faltante: 5 }),
    ]);
    expect(csv).toContain('Retornable');
    expect(csv).toContain('Sin stock');
  });

  it('un uso sin definir queda como celda vacía', () => {
    const fila = armarCsvReporteCompra([item({ esRetornable: null })]).split('\r\n')[1].split(';');
    expect(fila[6]).toBe('');
  });

  it('escapa punto y coma y comillas', () => {
    const csv = armarCsvReporteCompra([
      item({ nombre: 'Cable "HDMI"; 2 m', compatibilidad: 'M402; M426' }),
    ]);
    expect(csv).toContain('"Cable ""HDMI""; 2 m"');
    expect(csv).toContain('"M402; M426"');
  });

  it('sin ítems devuelve solo el encabezado', () => {
    expect(armarCsvReporteCompra([])).toBe(ENCABEZADO);
  });
});

describe('nombreArchivoReporte', () => {
  it('usa la fecha local con ceros', () => {
    expect(nombreArchivoReporte(new Date(2026, 8, 5))).toBe('reporte-compra-2026-09-05.csv');
  });
});
