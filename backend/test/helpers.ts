import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module.js';
import { configurarApp } from '../src/app.setup.js';

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
