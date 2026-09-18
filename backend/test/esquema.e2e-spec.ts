import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Articulo } from '../src/articulos/articulo.entity.js';
import { crearApp, limpiarBase } from './helpers.js';

describe('Esquema de base de datos', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await crearApp();
    ds = app.get(DataSource);
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  it('crea las tablas articulos, prestamos y movimientos', async () => {
    const filas: { table_name: string }[] = await ds.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
    );
    expect(filas.map((f) => f.table_name)).toEqual(
      expect.arrayContaining(['articulos', 'prestamos', 'movimientos']),
    );
  });

  it('usa columnas snake_case en articulos', async () => {
    const filas: { column_name: string }[] = await ds.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'articulos'",
    );
    expect(filas.map((f) => f.column_name)).toEqual(
      expect.arrayContaining([
        'es_retornable',
        'stock_actual',
        'stock_minimo',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('rechaza un stock_actual negativo (CHECK)', async () => {
    const repo = ds.getRepository(Articulo);
    await expect(
      repo.insert({
        nombre: 'Malo',
        categoria: 'X',
        esRetornable: false,
        stockActual: -1,
        stockMinimo: 0,
      }),
    ).rejects.toThrow();
  });

  it('impide repetir el nombre de un artículo (UNIQUE)', async () => {
    const repo = ds.getRepository(Articulo);
    const datos = { nombre: 'Cable', categoria: 'X', esRetornable: false };
    await repo.insert(datos);
    await expect(repo.insert(datos)).rejects.toThrow();
  });
});
