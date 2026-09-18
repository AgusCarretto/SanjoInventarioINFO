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
      expect.arrayContaining([
        'articulos',
        'prestamos',
        'movimientos',
        'categorias',
        'tipos_articulo',
      ]),
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

  it('solo el nombre es obligatorio: el resto de las columnas acepta null', async () => {
    const filas: { column_name: string; is_nullable: string }[] = await ds.query(
      "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'articulos'",
    );
    const anulable = (col: string) =>
      filas.find((f) => f.column_name === col)?.is_nullable;
    expect(anulable('nombre')).toBe('NO');
    for (const col of [
      'categoria_id',
      'tipo_id',
      'marca',
      'modelo',
      'compatibilidad',
      'es_retornable',
      'stock_actual',
      'stock_minimo',
    ]) {
      expect(anulable(col)).toBe('YES');
    }
  });

  it('la categoría ya no es un texto libre: se guarda como referencia al catálogo', async () => {
    const filas: { column_name: string }[] = await ds.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'articulos'",
    );
    expect(filas.map((f) => f.column_name)).not.toContain('categoria');
  });

  it('un artículo con solo el nombre se guarda con todo lo demás en null', async () => {
    const repo = ds.getRepository(Articulo);
    const guardado = await repo.save(repo.create({ nombre: 'Solo nombre' }));
    const leido = await repo.findOneByOrFail({ id: guardado.id });
    expect(leido).toMatchObject({
      categoriaId: null,
      tipoId: null,
      marca: null,
      modelo: null,
      compatibilidad: null,
      esRetornable: null,
      stockActual: null,
      stockMinimo: null,
    });
  });

  it('rechaza un stock_actual negativo (CHECK)', async () => {
    const repo = ds.getRepository(Articulo);
    await expect(
      repo.insert({
        nombre: 'Malo',
        esRetornable: false,
        stockActual: -1,
        stockMinimo: 0,
      }),
    ).rejects.toThrow();
  });

  it('impide repetir el nombre de un artículo (UNIQUE)', async () => {
    const repo = ds.getRepository(Articulo);
    const datos = { nombre: 'Cable', esRetornable: false };
    await repo.insert(datos);
    await expect(repo.insert(datos)).rejects.toThrow();
  });
});
