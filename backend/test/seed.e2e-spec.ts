import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { cargarDatosEjemplo } from '../src/seed/cargar-datos-ejemplo.js';
import { crearApp, limpiarBase } from './helpers.js';

describe('Seed de datos de ejemplo (e2e)', () => {
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

  it('carga los datos una sola vez y nunca pisa una tabla con datos', async () => {
    const ds = app.get(DataSource);
    expect(await cargarDatosEjemplo(ds)).toBe(true);
    expect(await cargarDatosEjemplo(ds)).toBe(false);
    const { body } = await request(app.getHttpServer())
      .get('/api/articulos')
      .expect(200);
    expect(body).toHaveLength(10);
  });

  it('produce las alertas esperadas, en orden', async () => {
    await cargarDatosEjemplo(app.get(DataSource));
    const { body } = await request(app.getHttpServer())
      .get('/api/alertas/stock')
      .expect(200);
    expect(body.resumen).toEqual({ total: 5, sinStock: 1, bajos: 4 });
    expect(body.items.map((i: { nombre: string }) => i.nombre)).toEqual([
      'Cable de red Cat6',
      'Cable HDMI 2 m',
      'Pilas AAA',
      'Teclado USB',
      'Parlante portátil',
    ]);
  });

  it('deja 1 unidad prestada del proyector y del parlante', async () => {
    await cargarDatosEjemplo(app.get(DataSource));
    const { body } = await request(app.getHttpServer())
      .get('/api/articulos')
      .expect(200);
    const por = (nombre: string) =>
      body.find((a: { nombre: string }) => a.nombre === nombre);
    expect(por('Proyector Epson EB-X06')).toMatchObject({
      prestados: 1,
      disponibles: 3,
    });
    expect(por('Parlante portátil')).toMatchObject({
      prestados: 1,
      disponibles: 0,
    });
  });
});
