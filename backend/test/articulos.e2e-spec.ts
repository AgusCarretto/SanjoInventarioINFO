import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPrestamo } from '../src/prestamos/prestamo.entity.js';
import {
  crearApp,
  crearArticulo,
  crearMovimiento,
  crearPrestamo,
  limpiarBase,
} from './helpers.js';

describe('Artículos (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await crearApp();
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/articulos', () => {
    it('devuelve prestados, disponibles y nivel, ordenados por categoría y nombre', async () => {
      const proyector = await crearArticulo(app, {
        nombre: 'Proyector',
        categoria: 'Equipos',
        esRetornable: true,
        stockActual: 4,
        stockMinimo: 2,
      });
      await crearPrestamo(app, { articuloId: proyector.id, cantidad: 1 });
      await crearPrestamo(app, {
        articuloId: proyector.id,
        cantidad: 2,
        estado: EstadoPrestamo.DEVUELTO, // no cuenta como prestado
      });
      await crearArticulo(app, {
        nombre: 'Pilas AA',
        categoria: 'Insumos',
        stockActual: 0,
        stockMinimo: 10,
      });
      await crearArticulo(app, {
        nombre: 'Cable HDMI',
        categoria: 'Cables',
        stockActual: 3,
        stockMinimo: 5,
      });

      const { body } = await request(app.getHttpServer())
        .get('/api/articulos')
        .expect(200);

      expect(body.map((a: { nombre: string }) => a.nombre)).toEqual([
        'Cable HDMI', // Cables
        'Proyector', // Equipos
        'Pilas AA', // Insumos
      ]);
      expect(body[1]).toMatchObject({
        prestados: 1,
        disponibles: 3,
        stockActual: 4,
        nivel: null,
      });
      expect(body[0]).toMatchObject({
        prestados: 0,
        disponibles: 3,
        nivel: 'BAJO',
      });
      expect(body[2]).toMatchObject({ nivel: 'SIN_STOCK' });
    });
  });

  describe('GET /api/articulos/:id', () => {
    it('devuelve el artículo con su disponibilidad', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Parlante',
        esRetornable: true,
        stockActual: 1,
        stockMinimo: 1,
      });
      await crearPrestamo(app, { articuloId: a.id });
      const { body } = await request(app.getHttpServer())
        .get(`/api/articulos/${a.id}`)
        .expect(200);
      expect(body).toMatchObject({
        id: a.id,
        prestados: 1,
        disponibles: 0,
        nivel: 'BAJO',
      });
    });

    it('responde 404 si no existe', async () => {
      await request(app.getHttpServer()).get('/api/articulos/9999').expect(404);
    });

    it('responde 400 si el id no es un número', async () => {
      await request(app.getHttpServer()).get('/api/articulos/abc').expect(400);
    });
  });

  describe('POST /api/articulos', () => {
    it('crea el artículo con todos los datos, recortando espacios', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/articulos')
        .send({
          nombre: '  Mouse USB  ',
          categoria: '  Periféricos ',
          esRetornable: false,
          stockActual: 2,
          stockMinimo: 5,
        })
        .expect(201);
      expect(body).toMatchObject({
        nombre: 'Mouse USB',
        categoria: 'Periféricos',
        esRetornable: false,
        stockActual: 2,
        stockMinimo: 5,
        prestados: 0,
        disponibles: 2,
        nivel: 'BAJO',
      });
    });

    it('crea un artículo con solo el nombre: lo demás queda en null y no hay alerta', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/articulos')
        .send({ nombre: 'Router de prueba' })
        .expect(201);
      expect(body).toMatchObject({
        nombre: 'Router de prueba',
        categoria: null,
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
        prestados: 0,
        disponibles: null,
        nivel: null,
      });
    });

    it('acepta null explícito y trata la categoría vacía como null', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/articulos')
        .send({
          nombre: 'Con nulos',
          categoria: '   ',
          esRetornable: null,
          stockActual: null,
          stockMinimo: null,
        })
        .expect(201);
      expect(body).toMatchObject({
        categoria: null,
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
      });
    });

    it.each([
      ['nombre vacío', { nombre: '', categoria: 'X', esRetornable: false }],
      ['nombre de solo espacios', { nombre: '   ' }],
      ['sin nombre', { categoria: 'X' }],
      ['nombre null', { nombre: null }],
      [
        'stock negativo',
        { nombre: 'A', categoria: 'X', esRetornable: false, stockActual: -1 },
      ],
      [
        'stock decimal',
        { nombre: 'A', categoria: 'X', esRetornable: false, stockMinimo: 1.5 },
      ],
      [
        'esRetornable que no es booleano',
        { nombre: 'A', categoria: 'X', esRetornable: 'si' },
      ],
      [
        'un campo no permitido',
        { nombre: 'A', categoria: 'X', esRetornable: false, id: 7 },
      ],
    ])('responde 400 con %s', async (_caso, cuerpo) => {
      await request(app.getHttpServer())
        .post('/api/articulos')
        .send(cuerpo)
        .expect(400);
    });

    it('responde 409 si el nombre ya existe', async () => {
      await crearArticulo(app, { nombre: 'Cable' });
      await request(app.getHttpServer())
        .post('/api/articulos')
        .send({ nombre: 'Cable', categoria: 'X', esRetornable: false })
        .expect(409);
    });
  });

  describe('PATCH /api/articulos/:id', () => {
    it('actualiza campos y devuelve el artículo', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        stockActual: 3,
        stockMinimo: 5,
      });
      const { body } = await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ stockActual: 8, categoria: 'Cables' })
        .expect(200);
      expect(body).toMatchObject({
        stockActual: 8,
        categoria: 'Cables',
        nivel: null,
      });
    });

    it('permite dejar en null categoría, tipo y stocks', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        categoria: 'Cables',
        esRetornable: false,
        stockActual: 3,
        stockMinimo: 5,
      });
      const { body } = await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({
          categoria: null,
          esRetornable: null,
          stockActual: null,
          stockMinimo: null,
        })
        .expect(200);
      expect(body).toMatchObject({
        categoria: null,
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
        disponibles: null,
        nivel: null,
      });
    });

    it('R1: permite cambiar el tipo si el artículo no tiene historial', async () => {
      const a = await crearArticulo(app, { nombre: 'Cable', esRetornable: false });
      const { body } = await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ esRetornable: true })
        .expect(200);
      expect(body.esRetornable).toBe(true);
    });

    it('R1: rechaza cambiar el tipo si tiene préstamos', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 2,
      });
      await crearPrestamo(app, { articuloId: a.id });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ esRetornable: false })
        .expect(409);
    });

    it('R1: rechaza cambiar el tipo si tiene movimientos', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Pilas',
        esRetornable: false,
        stockActual: 5,
      });
      await crearMovimiento(app, { articuloId: a.id });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ esRetornable: true })
        .expect(409);
    });

    it('R1: reenviar el mismo tipo no es un cambio, aunque haya historial', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 2,
      });
      await crearPrestamo(app, { articuloId: a.id });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ esRetornable: true, categoria: 'Equipos' })
        .expect(200);
    });

    it('R2: no deja el stock sin dato (null) si hay unidades prestadas', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 4,
      });
      await crearPrestamo(app, { articuloId: a.id, cantidad: 1 });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${a.id}`)
        .send({ stockActual: null })
        .expect(409);
    });

    it('R2: rechaza dejar el stock por debajo de lo prestado y acepta igualarlo', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 4,
        stockMinimo: 1,
      });
      await crearPrestamo(app, { articuloId: a.id, cantidad: 3 });
      const patch = (stockActual: number) =>
        request(app.getHttpServer())
          .patch(`/api/articulos/${a.id}`)
          .send({ stockActual });
      await patch(2).expect(409);
      await patch(3).expect(200);
    });

    it('responde 404 si no existe', async () => {
      await request(app.getHttpServer())
        .patch('/api/articulos/9999')
        .send({ stockActual: 1 })
        .expect(404);
    });

    it('responde 409 si el nuevo nombre ya existe', async () => {
      await crearArticulo(app, { nombre: 'Cable' });
      const b = await crearArticulo(app, { nombre: 'Pilas' });
      await request(app.getHttpServer())
        .patch(`/api/articulos/${b.id}`)
        .send({ nombre: 'Cable' })
        .expect(409);
    });
  });

  describe('DELETE /api/articulos/:id', () => {
    it('elimina un artículo sin historial', async () => {
      const a = await crearArticulo(app, { nombre: 'Cable' });
      await request(app.getHttpServer())
        .delete(`/api/articulos/${a.id}`)
        .expect(204);
      await request(app.getHttpServer())
        .get(`/api/articulos/${a.id}`)
        .expect(404);
    });

    it('R3: responde 409 si tiene préstamos', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 2,
      });
      await crearPrestamo(app, { articuloId: a.id });
      await request(app.getHttpServer())
        .delete(`/api/articulos/${a.id}`)
        .expect(409);
    });

    it('responde 404 si no existe', async () => {
      await request(app.getHttpServer())
        .delete('/api/articulos/9999')
        .expect(404);
    });
  });
});
