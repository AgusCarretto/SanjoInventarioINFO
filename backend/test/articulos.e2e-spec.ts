import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPrestamo } from '../src/prestamos/prestamo.entity.js';
import {
  crearApp,
  crearArticulo,
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
});
