import { DataSource } from 'typeorm';
import { Articulo } from '../articulos/articulo.entity.js';
import { Categoria } from '../catalogo/categoria.entity.js';
import { TipoArticulo } from '../catalogo/tipo-articulo.entity.js';
import { formatearFechaLocal } from '../common/fecha.js';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity.js';
import { cargarCatalogoInicial } from './catalogo.js';
import { ARTICULOS_EJEMPLO } from './datos-ejemplo.js';

/**
 * Carga los datos de ejemplo solo si `articulos` está vacía. Devuelve si cargó.
 * Antes se asegura de que el catálogo (categorías y tipos) esté cargado.
 */
export async function cargarDatosEjemplo(
  ds: DataSource,
  hoy: Date = new Date(),
): Promise<boolean> {
  if ((await ds.getRepository(Articulo).count()) > 0) return false;
  await cargarCatalogoInicial(ds);

  return ds.transaction(async (manager) => {
    if ((await manager.count(Articulo)) > 0) return false;

    const categorias = await manager.find(Categoria);
    const tipos = await manager.find(TipoArticulo);
    const idCategoria = (nombre: string): number => {
      const encontrada = categorias.find((c) => c.nombre === nombre);
      if (!encontrada) throw new Error(`Falta la categoría "${nombre}"`);
      return encontrada.id;
    };
    const idTipo = (categoria: string, nombre: string): number => {
      const categoriaId = idCategoria(categoria);
      const encontrado = tipos.find(
        (t) => t.categoriaId === categoriaId && t.nombre === nombre,
      );
      if (!encontrado) {
        throw new Error(`Falta el tipo "${nombre}" en "${categoria}"`);
      }
      return encontrado.id;
    };

    const guardados = await manager.save(
      Articulo,
      ARTICULOS_EJEMPLO.map(({ categoria, tipo, ...resto }) =>
        manager.create(Articulo, {
          ...resto,
          categoriaId: idCategoria(categoria),
          tipoId: idTipo(categoria, tipo),
        }),
      ),
    );
    const idDe = (nombre: string): number => {
      const encontrado = guardados.find((a) => a.nombre === nombre);
      if (!encontrado) {
        throw new Error(`Falta el artículo de ejemplo "${nombre}"`);
      }
      return encontrado.id;
    };
    const enDias = (n: number): Date => {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + n);
      return fecha;
    };

    await manager.save(Prestamo, [
      manager.create(Prestamo, {
        articuloId: idDe('Proyector Epson EB-X06'),
        cantidad: 1,
        prestadoA: 'Prof. Gómez - 3° B',
        fechaSalida: enDias(-3),
        fechaDevolucionEsperada: formatearFechaLocal(enDias(-1)), // vencido ayer
        estado: EstadoPrestamo.ACTIVO,
      }),
      manager.create(Prestamo, {
        articuloId: idDe('Parlante portátil'),
        cantidad: 1,
        prestadoA: 'Preceptoría 1° año',
        fechaSalida: enDias(-1),
        fechaDevolucionEsperada: formatearFechaLocal(enDias(3)),
        estado: EstadoPrestamo.ACTIVO,
      }),
    ]);
    return true;
  });
}
