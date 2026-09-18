import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import {
  crearApp,
  crearArticulo,
  crearPrestamo,
  limpiarBase,
} from './helpers.js';

describe('GET /api/alertas/stock (e2e)', () => {
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

  const pedir = () =>
    request(app.getHttpServer()).get('/api/alertas/stock').expect(200);

  it('devuelve solo los artículos en alerta, ordenados', async () => {
    await crearArticulo(app, {
      nombre: 'Mouse',
      stockActual: 15,
      stockMinimo: 5,
    });
    await crearArticulo(app, {
      nombre: 'HDMI',
      stockActual: 3,
      stockMinimo: 5,
    });
    await crearArticulo(app, {
      nombre: 'Cat6',
      stockActual: 0,
      stockMinimo: 10,
    });
    const { body } = await pedir();
    expect(body.resumen).toEqual({ total: 2, sinStock: 1, bajos: 1 });
    expect(body.items.map((i: { nombre: string }) => i.nombre)).toEqual([
      'Cat6',
      'HDMI',
    ]);
    expect(body.items[1]).toMatchObject({ faltante: 2, nivel: 'BAJO' });
  });

  it('un préstamo no dispara alerta: se compara el total, no lo disponible', async () => {
    const a = await crearArticulo(app, {
      nombre: 'Proyector',
      esRetornable: true,
      stockActual: 3,
      stockMinimo: 1,
    });
    await crearPrestamo(app, { articuloId: a.id, cantidad: 2 }); // disponibles = 1
    const { body } = await pedir();
    expect(body.items).toEqual([]);
  });

  it('un retornable en alerta trae prestados y disponibles', async () => {
    const a = await crearArticulo(app, {
      nombre: 'Parlante',
      esRetornable: true,
      stockActual: 1,
      stockMinimo: 1,
    });
    await crearPrestamo(app, { articuloId: a.id, cantidad: 1 });
    const { body } = await pedir();
    expect(body.items[0]).toMatchObject({
      prestados: 1,
      disponibles: 0,
      faltante: 0,
      nivel: 'BAJO',
    });
  });

  it('sin artículos devuelve resumen en cero', async () => {
    const { body } = await pedir();
    expect(body.resumen).toEqual({ total: 0, sinStock: 0, bajos: 0 });
    expect(body.items).toEqual([]);
  });
});
