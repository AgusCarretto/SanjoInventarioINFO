import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { Movimiento } from '../src/movimientos/movimiento.entity.js';
import { crearApp, crearArticulo, crearMovimiento, limpiarBase } from './helpers.js';

describe('Movimientos (e2e)', () => {
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

  const post = (cuerpo: object) =>
    request(app.getHttpServer()).post('/api/movimientos').send(cuerpo);
  const movimientosDe = (articuloId: number) =>
    app.get(DataSource).getRepository(Movimiento).find({ where: { articuloId } });

  describe('POST /api/movimientos (SALIDA: registrar uso)', () => {
    it('resta 1 por defecto y deja registrado el movimiento', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Tóner',
        esRetornable: false,
        stockActual: 5,
        stockMinimo: 2,
      });
      const { body } = await post({ articuloId: a.id, tipo: 'SALIDA' }).expect(
        201,
      );
      expect(body).toMatchObject({ stockActual: 4, disponibles: 4, nivel: null });

      const movimientos = await movimientosDe(a.id);
      expect(movimientos).toHaveLength(1);
      expect(movimientos[0]).toMatchObject({ tipo: 'SALIDA', cantidad: 1 });
    });

    it('respeta la cantidad enviada', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        esRetornable: false,
        stockActual: 5,
      });
      const { body } = await post({
        articuloId: a.id,
        tipo: 'SALIDA',
        cantidad: 3,
      }).expect(201);
      expect(body.stockActual).toBe(2);
    });

    it('la alerta se activa si el stock queda igual o por debajo del mínimo', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Tóner',
        esRetornable: false,
        stockActual: 3,
        stockMinimo: 2,
      });
      const { body } = await post({
        articuloId: a.id,
        tipo: 'SALIDA',
        cantidad: 2,
      }).expect(201);
      expect(body).toMatchObject({ stockActual: 1, nivel: 'BAJO' });
    });

    it('responde 409 si no hay stock suficiente y no modifica nada', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        esRetornable: false,
        stockActual: 2,
      });
      const { body } = await post({
        articuloId: a.id,
        tipo: 'SALIDA',
        cantidad: 5,
      }).expect(409);
      expect(body.message).toContain('stock');
      expect(await movimientosDe(a.id)).toHaveLength(0);
      const { body: articulo } = await request(app.getHttpServer())
        .get(`/api/articulos/${a.id}`)
        .expect(200);
      expect(articulo.stockActual).toBe(2);
    });

    it('responde 409 si el stock quedaría justo en -1 (cantidad = stock + 1)', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        esRetornable: false,
        stockActual: 1,
      });
      await post({ articuloId: a.id, tipo: 'SALIDA', cantidad: 2 }).expect(409);
    });
  });

  describe('POST /api/movimientos (ENTRADA: reponer stock)', () => {
    it('suma la cantidad al stock', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        esRetornable: false,
        stockActual: 2,
      });
      const { body } = await post({
        articuloId: a.id,
        tipo: 'ENTRADA',
        cantidad: 5,
      }).expect(201);
      expect(body.stockActual).toBe(7);
      expect(await movimientosDe(a.id)).toHaveLength(1);
    });
  });

  describe('GET /api/movimientos (historial)', () => {
    it('devuelve vacío sin movimientos', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/movimientos')
        .expect(200);
      expect(body).toEqual([]);
    });

    it('devuelve más reciente primero, con el artículo y el detalle', async () => {
      const a = await crearArticulo(app, { nombre: 'Tóner', modelo: '26A' });
      const primero = await crearMovimiento(app, {
        articuloId: a.id,
        fecha: new Date('2026-01-01'),
      });
      const segundo = await crearMovimiento(app, {
        articuloId: a.id,
        detalle: 'Impresora de Secretaría',
        fecha: new Date('2026-02-01'),
      });
      const { body } = await request(app.getHttpServer())
        .get('/api/movimientos')
        .expect(200);
      expect(body.map((m: { id: number }) => m.id)).toEqual([segundo.id, primero.id]);
      expect(body[0]).toMatchObject({
        detalle: 'Impresora de Secretaría',
        articulo: { nombre: 'Tóner', modelo: '26A' },
      });
    });
  });

  describe('validaciones', () => {
    it('responde 404 si el artículo no existe', async () => {
      await post({ articuloId: 9999, tipo: 'SALIDA' }).expect(404);
    });

    it('responde 409 si el artículo es retornable', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 3,
      });
      const { body } = await post({ articuloId: a.id, tipo: 'SALIDA' }).expect(
        409,
      );
      expect(body.message).toContain('retornable');
      expect(await movimientosDe(a.id)).toHaveLength(0);
    });

    it('responde 409 si el uso del artículo no está definido', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Sin definir',
        esRetornable: null,
        stockActual: 3,
      });
      const { body } = await post({ articuloId: a.id, tipo: 'SALIDA' }).expect(
        409,
      );
      expect(body.message).toContain('uso');
    });

    it('responde 409 si el artículo no tiene stock cargado', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        esRetornable: false,
        stockActual: null,
      });
      const { body } = await post({ articuloId: a.id, tipo: 'SALIDA' }).expect(
        409,
      );
      expect(body.message).toContain('stock');
    });

    it.each([
      ['sin articuloId', { tipo: 'SALIDA' }],
      ['articuloId no numérico', { articuloId: 'x', tipo: 'SALIDA' }],
      ['sin tipo', { articuloId: 1 }],
      ['tipo inválido', { articuloId: 1, tipo: 'OTRO' }],
      ['cantidad en 0', { articuloId: 1, tipo: 'SALIDA', cantidad: 0 }],
      ['cantidad negativa', { articuloId: 1, tipo: 'SALIDA', cantidad: -1 }],
      ['cantidad decimal', { articuloId: 1, tipo: 'SALIDA', cantidad: 1.5 }],
      ['un campo no permitido', { articuloId: 1, tipo: 'SALIDA', extra: 'x' }],
    ])('responde 400 con %s', async (_caso, cuerpo) => {
      await post(cuerpo).expect(400);
    });
  });
});
