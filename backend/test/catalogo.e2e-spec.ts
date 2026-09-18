import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { cargarCatalogoInicial } from '../src/seed/catalogo.js';
import {
  crearApp,
  crearArticulo,
  idCategoria,
  idTipo,
  limpiarBase,
} from './helpers.js';

interface CategoriaApi {
  id: number;
  nombre: string;
  tipos: { id: number; nombre: string }[];
}

describe('Catálogo de categorías y tipos (e2e)', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await crearApp();
    ds = app.get(DataSource);
  });
  beforeEach(async () => {
    await limpiarBase(app); // deja cargado el catálogo inicial
  });
  afterAll(async () => {
    await app.close();
  });

  const pedir = async (): Promise<CategoriaApi[]> => {
    const { body } = await request(app.getHttpServer())
      .get('/api/catalogo')
      .expect(200);
    return body.categorias;
  };
  const tiposDe = (categorias: CategoriaApi[], nombre: string) =>
    categorias.find((c) => c.nombre === nombre)?.tipos.map((t) => t.nombre);
  const contar = async () => {
    const [f] = await ds.query(
      'SELECT (SELECT count(*) FROM categorias)::int AS c, (SELECT count(*) FROM tipos_articulo)::int AS t',
    );
    return f as { c: number; t: number };
  };

  describe('GET /api/catalogo', () => {
    it('trae las 5 categorías precargadas en su orden, con "Otros" al final', async () => {
      const categorias = await pedir();
      expect(categorias.map((c) => c.nombre)).toEqual([
        'Periféricos',
        'Componentes PC',
        'Impresoras',
        'Redes',
        'Otros',
      ]);
    });

    it('Impresoras trae exactamente los 6 tipos pedidos, en orden', async () => {
      expect(tiposDe(await pedir(), 'Impresoras')).toEqual([
        'Cartuchos',
        'Tóner',
        'Tinta',
        'Impresora',
        'Componentes',
        'Otros',
      ]);
    });

    it('Redes y Componentes PC traen los tipos de ejemplo pedidos', async () => {
      const categorias = await pedir();
      expect(tiposDe(categorias, 'Redes')).toEqual(
        expect.arrayContaining(['Cable de red', 'Conector RJ45']),
      );
      expect(tiposDe(categorias, 'Componentes PC')).toEqual(
        expect.arrayContaining([
          'Procesador',
          'Fuente de alimentación',
          'Memoria RAM',
          'Placa madre',
          'Disco rígido',
        ]),
      );
    });

    it('cada categoría tiene varios tipos y termina con "Otros"', async () => {
      for (const categoria of await pedir()) {
        expect(categoria.tipos.length).toBeGreaterThanOrEqual(5);
        expect(categoria.tipos[categoria.tipos.length - 1].nombre).toBe('Otros');
      }
    });

    it('refleja al instante lo que se agrega con SQL, respetando el orden', async () => {
      await ds.query(
        "INSERT INTO categorias (nombre, orden) VALUES ('Software', 5)",
      );
      await ds.query(
        "INSERT INTO tipos_articulo (categoria_id, nombre, orden) SELECT id, 'Licencia', 1 FROM categorias WHERE nombre = 'Software'",
      );
      const categorias = await pedir();
      // orden 5 va después de Redes (4) y antes de Otros (99)
      expect(categorias.map((c) => c.nombre)).toEqual([
        'Periféricos',
        'Componentes PC',
        'Impresoras',
        'Redes',
        'Software',
        'Otros',
      ]);
      expect(tiposDe(categorias, 'Software')).toEqual(['Licencia']);
    });
  });

  describe('catalogo-inicial.sql', () => {
    it('volver a correrlo no duplica nada', async () => {
      const antes = await contar();
      await cargarCatalogoInicial(ds);
      await cargarCatalogoInicial(ds);
      expect(await contar()).toEqual(antes);
    });
  });

  describe('reglas de la base (lo que protege al editar con SQL)', () => {
    it('no deja repetir una categoría ni un tipo dentro de la misma categoría', async () => {
      await expect(
        ds.query("INSERT INTO categorias (nombre) VALUES ('Redes')"),
      ).rejects.toThrow();
      await expect(
        ds.query(
          "INSERT INTO tipos_articulo (categoria_id, nombre) SELECT id, 'Switch' FROM categorias WHERE nombre = 'Redes'",
        ),
      ).rejects.toThrow();
    });

    it('un mismo nombre de tipo sí puede existir en categorías distintas', async () => {
      const categorias = await pedir();
      expect(tiposDe(categorias, 'Redes')).toContain('Otros');
      expect(tiposDe(categorias, 'Impresoras')).toContain('Otros');
    });

    it('no deja borrar una categoría que tiene artículos', async () => {
      await crearArticulo(app, {
        nombre: 'Cable',
        categoriaId: await idCategoria(app, 'Redes'),
      });
      await expect(
        ds.query("DELETE FROM categorias WHERE nombre = 'Redes'"),
      ).rejects.toThrow();
    });

    it('no deja borrar un tipo que tiene artículos', async () => {
      await crearArticulo(app, {
        nombre: 'Cable',
        categoriaId: await idCategoria(app, 'Redes'),
        tipoId: await idTipo(app, 'Redes', 'Cable de red'),
      });
      await expect(
        ds.query("DELETE FROM tipos_articulo WHERE nombre = 'Cable de red'"),
      ).rejects.toThrow();
    });

    it('borrar una categoría sin uso borra también sus tipos', async () => {
      await ds.query(
        "INSERT INTO categorias (nombre, orden) VALUES ('Temporal', 50)",
      );
      await ds.query(
        "INSERT INTO tipos_articulo (categoria_id, nombre) SELECT id, t FROM categorias, unnest(ARRAY['Uno','Dos']) AS t WHERE nombre = 'Temporal'",
      );
      const antes = await contar();
      await ds.query("DELETE FROM categorias WHERE nombre = 'Temporal'");
      const despues = await contar();
      expect(despues.c).toBe(antes.c - 1);
      expect(despues.t).toBe(antes.t - 2);
    });
  });
});
