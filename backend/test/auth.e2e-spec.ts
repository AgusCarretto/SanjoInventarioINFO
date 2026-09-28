import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { crearApp, crearAgente, limpiarBase, loguearAgente } from './helpers.js';

describe('Login (e2e)', () => {
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

  it('sin sesión, la API responde 401', async () => {
    await request(app.getHttpServer()).get('/api/articulos').expect(401);
  });

  it('con usuario y contraseña correctos, deja pasar', async () => {
    const agente = await loguearAgente(app);
    await agente.get('/api/articulos').expect(200);
  });

  it('responde 401 con la contraseña incorrecta', async () => {
    const agente = crearAgente(app);
    await agente.post('/api/auth/login').send({ usuario: 'test', password: 'incorrecta' }).expect(401);
    await agente.get('/api/articulos').expect(401);
  });

  it('responde 401 con un usuario que no existe', async () => {
    const agente = crearAgente(app);
    await agente.post('/api/auth/login').send({ usuario: 'fantasma', password: 'x' }).expect(401);
  });

  it('GET /api/auth/me devuelve el usuario logueado', async () => {
    const agente = await loguearAgente(app);
    const { body } = await agente.get('/api/auth/me').expect(200);
    expect(body).toEqual({ usuario: 'test' });
  });

  it('logout cierra la sesión: después, la API vuelve a responder 401', async () => {
    const agente = await loguearAgente(app);
    await agente.get('/api/articulos').expect(200);
    await agente.post('/api/auth/logout').expect(204);
    await agente.get('/api/articulos').expect(401);
  });

  it.each([
    ['sin usuario', { password: 'x' }],
    ['sin contraseña', { usuario: 'test' }],
  ])('responde 400 %s', async (_caso, cuerpo) => {
    await request(app.getHttpServer()).post('/api/auth/login').send(cuerpo).expect(400);
  });
});
