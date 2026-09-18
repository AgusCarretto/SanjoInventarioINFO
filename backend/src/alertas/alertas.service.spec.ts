import { ArticuloConDisponibilidad } from '../articulos/articulo-con-disponibilidad.js';
import { ArticulosService } from '../articulos/articulos.service.js';
import { clasificarNivel } from '../articulos/clasificar-nivel.js';
import { AlertasService } from './alertas.service.js';

function art(
  id: number,
  nombre: string,
  stockActual: number,
  stockMinimo: number,
  extra: Partial<ArticuloConDisponibilidad> = {},
): ArticuloConDisponibilidad {
  return {
    id,
    nombre,
    categoria: 'General',
    esRetornable: false,
    stockActual,
    stockMinimo,
    prestados: 0,
    disponibles: stockActual,
    nivel: clasificarNivel(stockActual, stockMinimo),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...extra,
  };
}

function servicioCon(lista: ArticuloConDisponibilidad[]): AlertasService {
  const articulos = {
    listarConDisponibilidad: vi.fn().mockResolvedValue(lista),
  };
  return new AlertasService(articulos as unknown as ArticulosService);
}

describe('AlertasService', () => {
  it('deja fuera los artículos por encima del mínimo', async () => {
    const r = await servicioCon([
      art(1, 'Ok', 10, 5),
      art(2, 'Bajo', 3, 5),
    ]).obtenerAlertasDeStock();
    expect(r.items.map((i) => i.nombre)).toEqual(['Bajo']);
  });

  it('ordena SIN_STOCK primero, luego mayor faltante, luego nombre', async () => {
    const r = await servicioCon([
      art(1, 'Teclado', 2, 4), // BAJO, faltante 2
      art(2, 'Cat6', 0, 10), // SIN_STOCK, faltante 10
      art(3, 'HDMI', 3, 5), // BAJO, faltante 2
      art(4, 'Parlante', 1, 1), // BAJO, faltante 0
      art(5, 'Pilas', 8, 10), // BAJO, faltante 2
    ]).obtenerAlertasDeStock();
    expect(r.items.map((i) => i.nombre)).toEqual([
      'Cat6',
      'HDMI',
      'Pilas',
      'Teclado',
      'Parlante',
    ]);
  });

  it('calcula faltante y resumen', async () => {
    const r = await servicioCon([
      art(1, 'Cat6', 0, 10),
      art(2, 'HDMI', 3, 5),
    ]).obtenerAlertasDeStock();
    expect(r.items[0]).toMatchObject({ nivel: 'SIN_STOCK', faltante: 10 });
    expect(r.items[1]).toMatchObject({ nivel: 'BAJO', faltante: 2 });
    expect(r.resumen).toEqual({ total: 2, sinStock: 1, bajos: 1 });
  });

  it('incluye prestados y disponibles de los retornables', async () => {
    const r = await servicioCon([
      art(1, 'Parlante', 1, 1, {
        esRetornable: true,
        prestados: 1,
        disponibles: 0,
      }),
    ]).obtenerAlertasDeStock();
    expect(r.items[0]).toMatchObject({
      esRetornable: true,
      prestados: 1,
      disponibles: 0,
    });
  });

  it('ignora los artículos sin stock actual o sin mínimo cargado', async () => {
    const r = await servicioCon([
      art(1, 'Sin stock cargado', 0, 5, {
        stockActual: null,
        disponibles: null,
        nivel: null,
      }),
      art(2, 'Sin mínimo', 0, 5, { stockMinimo: null, nivel: null }),
      art(3, 'Bajo', 3, 5),
    ]).obtenerAlertasDeStock();
    expect(r.items.map((i) => i.nombre)).toEqual(['Bajo']);
    expect(r.resumen).toEqual({ total: 1, sinStock: 0, bajos: 1 });
  });

  it('sin alertas devuelve resumen en cero y lista vacía', async () => {
    const r = await servicioCon([art(1, 'Ok', 10, 5)]).obtenerAlertasDeStock();
    expect(r.resumen).toEqual({ total: 0, sinStock: 0, bajos: 0 });
    expect(r.items).toEqual([]);
    expect(typeof r.generadoEn).toBe('string');
  });
});
