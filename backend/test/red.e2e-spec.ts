import { INestApplication } from '@nestjs/common';
import { crearApp, limpiarBase, loguearAgente } from './helpers.js';

describe('Red / IPs del colegio (e2e)', () => {
  let app: INestApplication;
  let agente: Awaited<ReturnType<typeof loguearAgente>>;

  beforeAll(async () => {
    app = await crearApp();
    agente = await loguearAgente(app);
  });
  beforeEach(async () => {
    await limpiarBase(app);
  });
  afterAll(async () => {
    await app.close();
  });

  describe('equipos', () => {
    it('crea y lista ordenado por nombre', async () => {
      await agente.post('/api/red/equipos').send({ nombre: 'Zona B', ip: '192.168.1.10' }).expect(201);
      await agente.post('/api/red/equipos').send({ nombre: 'Aula 1', ip: '192.168.1.11' }).expect(201);
      const { body } = await agente.get('/api/red/equipos').expect(200);
      expect(body.map((e: { nombre: string }) => e.nombre)).toEqual(['Aula 1', 'Zona B']);
    });

    it('la puerta de enlace es opcional', async () => {
      const { body } = await agente
        .post('/api/red/equipos')
        .send({ nombre: 'Gimnasio A', ip: '192.168.1.204' })
        .expect(201);
      expect(body.puertaEnlace).toBeNull();
    });

    it('responde 409 si la IP ya existe', async () => {
      await agente.post('/api/red/equipos').send({ nombre: 'A', ip: '192.168.1.50' }).expect(201);
      await agente.post('/api/red/equipos').send({ nombre: 'B', ip: '192.168.1.50' }).expect(409);
    });

    it('responde 400 con una IP inválida', async () => {
      await agente.post('/api/red/equipos').send({ nombre: 'A', ip: 'no-es-una-ip' }).expect(400);
    });

    it('edita y elimina', async () => {
      const { body: creado } = await agente
        .post('/api/red/equipos')
        .send({ nombre: 'A', ip: '192.168.1.60', puertaEnlace: '192.168.1.251' })
        .expect(201);
      await agente.patch(`/api/red/equipos/${creado.id}`).send({ nombre: 'A (renombrado)' }).expect(200);
      await agente.delete(`/api/red/equipos/${creado.id}`).expect(204);
      const { body } = await agente.get('/api/red/equipos').expect(200);
      expect(body).toEqual([]);
    });
  });

  describe('config (DNS de toda la red)', () => {
    it('sin configurar, devuelve todo en null', async () => {
      const { body } = await agente.get('/api/red/config').expect(200);
      expect(body).toEqual({ dns: null, dnsAlternativo: null });
    });

    it('se actualiza y se puede volver a pedir', async () => {
      await agente
        .patch('/api/red/config')
        .send({ dns: '200.40.30.245', dnsAlternativo: '200.40.220.245' })
        .expect(200);
      const { body } = await agente.get('/api/red/config').expect(200);
      expect(body).toEqual({ dns: '200.40.30.245', dnsAlternativo: '200.40.220.245' });
    });
  });
});
