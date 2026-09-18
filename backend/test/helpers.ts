import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { Articulo } from '../src/articulos/articulo.entity.js';
import {
  Movimiento,
  TipoMovimiento,
} from '../src/movimientos/movimiento.entity.js';
import { EstadoPrestamo, Prestamo } from '../src/prestamos/prestamo.entity.js';
import { cargarCatalogoInicial } from '../src/seed/catalogo.js';

export async function crearApp(): Promise<INestApplication> {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Los e2e deben correr con NODE_ENV=test');
  }
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication();
  configurarApp(app);
  await app.init();
  const base = String(app.get(DataSource).options.database);
  if (!base.endsWith('_test')) {
    await app.close();
    throw new Error(`Los e2e solo corren contra una base *_test, no "${base}"`);
  }
  return app;
}

/** Vacía todo y deja cargado el catálogo inicial, como en una instalación nueva. */
export async function limpiarBase(app: INestApplication): Promise<void> {
  const ds = app.get(DataSource);
  await ds.query(
    'TRUNCATE TABLE prestamos, movimientos, articulos, tipos_articulo, categorias RESTART IDENTITY CASCADE',
  );
  await cargarCatalogoInicial(ds);
}

export async function idCategoria(
  app: INestApplication,
  nombre: string,
): Promise<number> {
  const filas: { id: number }[] = await app
    .get(DataSource)
    .query('SELECT id FROM categorias WHERE nombre = $1', [nombre]);
  if (filas.length === 0) throw new Error(`No existe la categoría "${nombre}"`);
  return filas[0].id;
}

export async function idTipo(
  app: INestApplication,
  categoria: string,
  nombre: string,
): Promise<number> {
  const filas: { id: number }[] = await app.get(DataSource).query(
    `SELECT t.id FROM tipos_articulo t
       JOIN categorias c ON c.id = t.categoria_id
      WHERE c.nombre = $1 AND t.nombre = $2`,
    [categoria, nombre],
  );
  if (filas.length === 0) {
    throw new Error(`No existe el tipo "${nombre}" en "${categoria}"`);
  }
  return filas[0].id;
}

export async function crearArticulo(
  app: INestApplication,
  datos: Partial<Articulo> & Pick<Articulo, 'nombre'>,
): Promise<Articulo> {
  const repo = app.get(DataSource).getRepository(Articulo);
  return repo.save(
    repo.create({
      esRetornable: false,
      stockActual: 0,
      stockMinimo: 0,
      ...datos,
    }),
  );
}

export async function crearMovimiento(
  app: INestApplication,
  datos: { articuloId: number } & Partial<Movimiento>,
): Promise<Movimiento> {
  const repo = app.get(DataSource).getRepository(Movimiento);
  return repo.save(
    repo.create({ tipo: TipoMovimiento.ENTRADA, cantidad: 1, ...datos }),
  );
}

export async function crearPrestamo(
  app: INestApplication,
  datos: { articuloId: number } & Partial<Prestamo>,
): Promise<Prestamo> {
  const repo = app.get(DataSource).getRepository(Prestamo);
  return repo.save(
    repo.create({
      cantidad: 1,
      prestadoA: 'Prof. de prueba',
      fechaDevolucionEsperada: '2099-01-01',
      estado: EstadoPrestamo.ACTIVO,
      ...datos,
    }),
  );
}
