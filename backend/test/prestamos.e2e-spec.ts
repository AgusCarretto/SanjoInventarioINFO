import { INestApplication } from '@nestjs/common';
import { crearApp, crearArticulo, crearPrestamo, limpiarBase, loguearAgente } from './helpers.js';

describe('Préstamos (e2e)', () => {
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

  const post = (cuerpo: object) => agente.post('/api/prestamos').send(cuerpo);
  const devolver = (id: number) => agente.patch(`/api/prestamos/${id}/devolver`);
  const articulo = (id: number) => agente.get(`/api/articulos/${id}`);

  it('presta y resta del stock disponible', async () => {
    const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 4 });
    const { body } = await post({ articuloId: a.id, cantidad: 2, prestadoA: 'Prof. Gómez' }).expect(201);
    expect(body).toMatchObject({ articuloId: a.id, cantidad: 2, prestadoA: 'Prof. Gómez' });
    expect((await articulo(a.id)).body).toMatchObject({ stockActual: 2, prestados: 2 });
  });

  it('responde 409 si pide más de lo disponible', async () => {
    const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 1 });
    await post({ articuloId: a.id, cantidad: 2, prestadoA: 'Prof. Gómez' }).expect(409);
  });

  it('responde 409 si el artículo no es retornable', async () => {
    const a = await crearArticulo(app, { nombre: 'Mouse', esRetornable: false, stockActual: 5 });
    await post({ articuloId: a.id, prestadoA: 'Prof. Gómez' }).expect(409);
  });

  it('responde 400 sin prestadoA', async () => {
    const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 1 });
    await post({ articuloId: a.id }).expect(400);
  });

  it('GET /api/prestamos solo trae los activos', async () => {
    const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 2 });
    const activo = await crearPrestamo(app, { articuloId: a.id });
    await crearPrestamo(app, { articuloId: a.id, estado: 'DEVUELTO' as never });
    const { body } = await agente.get('/api/prestamos').expect(200);
    expect(body.map((p: { id: number }) => p.id)).toEqual([activo.id]);
  });

  it('devolver suma el stock, marca devuelto y desaparece de GET /prestamos', async () => {
    const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 2 });
    const { body: creado } = await post({ articuloId: a.id, cantidad: 2, prestadoA: 'Prof. Gómez' });
    await devolver(creado.id).expect(200);
    expect((await articulo(a.id)).body).toMatchObject({ stockActual: 2, prestados: 0 });
    const { body } = await agente.get('/api/prestamos').expect(200);
    expect(body).toEqual([]);
  });

  it('responde 409 si ya estaba devuelto', async () => {
    const a = await crearArticulo(app, { nombre: 'Proyector', esRetornable: true, stockActual: 1 });
    const { body: creado } = await post({ articuloId: a.id, prestadoA: 'Prof. Gómez' });
    await devolver(creado.id).expect(200);
    await devolver(creado.id).expect(409);
  });

  it('responde 404 al devolver un préstamo que no existe', async () => {
    await devolver(9999).expect(404);
  });
});
