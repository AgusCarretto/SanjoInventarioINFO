import { DataSource } from 'typeorm';
import { Articulo } from '../articulos/articulo.entity.js';
import { formatearFechaLocal } from '../common/fecha.js';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity.js';
import { ARTICULOS_EJEMPLO } from './datos-ejemplo.js';

/** Carga los datos de ejemplo solo si `articulos` está vacía. Devuelve si cargó. */
export async function cargarDatosEjemplo(
  ds: DataSource,
  hoy: Date = new Date(),
): Promise<boolean> {
  return ds.transaction(async (manager) => {
    if ((await manager.count(Articulo)) > 0) return false;

    const guardados = await manager.save(
      Articulo,
      ARTICULOS_EJEMPLO.map((a) => manager.create(Articulo, a)),
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
