import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';
import { Articulo } from '../src/articulos/articulo.entity.js';
import { EstadoPrestamo, Prestamo } from '../src/prestamos/prestamo.entity.js';

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

export async function limpiarBase(app: INestApplication): Promise<void> {
  await app
    .get(DataSource)
    .query(
      'TRUNCATE TABLE prestamos, movimientos, articulos RESTART IDENTITY CASCADE',
    );
}

export async function crearArticulo(
  app: INestApplication,
  datos: Partial<Articulo> & Pick<Articulo, 'nombre'>,
): Promise<Articulo> {
  const repo = app.get(DataSource).getRepository(Articulo);
  return repo.save(
    repo.create({
      categoria: 'General',
      esRetornable: false,
      stockActual: 0,
      stockMinimo: 0,
      ...datos,
    }),
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
