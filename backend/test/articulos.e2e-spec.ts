import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { EstadoPrestamo } from '../src/prestamos/prestamo.entity.js';
import {
  crearApp,
  crearArticulo,
  crearMovimiento,
  crearPrestamo,
  idCategoria,
  idTipo,
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

  const post = (cuerpo: object) =>
    request(app.getHttpServer()).post('/api/articulos').send(cuerpo);
  const patch = (id: number, cuerpo: object) =>
    request(app.getHttpServer()).patch(`/api/articulos/${id}`).send(cuerpo);

  describe('GET /api/articulos', () => {
    it('devuelve prestados, disponibles y nivel, ordenados por categoría del catálogo y nombre', async () => {
      const proyector = await crearArticulo(app, {
        nombre: 'Proyector',
        categoriaId: await idCategoria(app, 'Otros'),
        tipoId: await idTipo(app, 'Otros', 'Proyector'),
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
      const perifericos = await idCategoria(app, 'Periféricos');
      await crearArticulo(app, {
        nombre: 'Teclado',
        categoriaId: perifericos,
        stockActual: 0,
        stockMinimo: 10,
      });
      await crearArticulo(app, {
        nombre: 'Mouse',
        categoriaId: perifericos,
        stockActual: 3,
        stockMinimo: 5,
      });
      await crearArticulo(app, {
        nombre: 'Cable de red',
        categoriaId: await idCategoria(app, 'Redes'),
      });
      await crearArticulo(app, { nombre: 'Suelto' }); // sin categoría

      const { body } = await request(app.getHttpServer())
        .get('/api/articulos')
        .expect(200);

      // Orden del catálogo (Periféricos, Redes, Otros), después nombre; sin categoría al final.
      expect(body.map((a: { nombre: string }) => a.nombre)).toEqual([
        'Mouse',
        'Teclado',
        'Cable de red',
        'Proyector',
        'Suelto',
      ]);
      expect(body[3]).toMatchObject({
        prestados: 1,
        disponibles: 3,
        stockActual: 4,
        nivel: null,
        categoria: 'Otros',
        tipo: 'Proyector',
      });
      expect(body[0]).toMatchObject({
        prestados: 0,
        disponibles: 3,
        nivel: 'BAJO',
        categoria: 'Periféricos',
        tipo: null,
      });
      expect(body[1]).toMatchObject({ nivel: 'SIN_STOCK' });
      expect(body[4]).toMatchObject({ categoria: null, categoriaId: null });
    });
  });

  describe('GET /api/articulos/:id', () => {
    it('devuelve el artículo con su disponibilidad y sus datos', async () => {
      const categoriaId = await idCategoria(app, 'Periféricos');
      const tipoId = await idTipo(app, 'Periféricos', 'Parlantes');
      const a = await crearArticulo(app, {
        nombre: 'Parlante',
        categoriaId,
        tipoId,
        marca: 'Logitech',
        modelo: 'Z120',
        compatibilidad: 'Cualquier equipo con salida de 3,5 mm',
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
        categoria: 'Periféricos',
        categoriaId,
        tipo: 'Parlantes',
        tipoId,
        marca: 'Logitech',
        modelo: 'Z120',
        compatibilidad: 'Cualquier equipo con salida de 3,5 mm',
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
      const categoriaId = await idCategoria(app, 'Impresoras');
      const tipoId = await idTipo(app, 'Impresoras', 'Tóner');
      const { body } = await post({
        nombre: '  Tóner HP 26A  ',
        categoriaId,
        tipoId,
        marca: '  HP ',
        modelo: ' 26A ',
        compatibilidad: ' LaserJet Pro M402, M426 ',
        esRetornable: false,
        stockActual: 2,
        stockMinimo: 5,
      }).expect(201);
      expect(body).toMatchObject({
        nombre: 'Tóner HP 26A',
        categoria: 'Impresoras',
        categoriaId,
        tipo: 'Tóner',
        tipoId,
        marca: 'HP',
        modelo: '26A',
        compatibilidad: 'LaserJet Pro M402, M426',
        esRetornable: false,
        stockActual: 2,
        stockMinimo: 5,
        prestados: 0,
        disponibles: 2,
        nivel: 'BAJO',
      });
    });

    it('crea un artículo con solo el nombre: lo demás queda en null y no hay alerta', async () => {
      const { body } = await post({ nombre: 'Router de prueba' }).expect(201);
      expect(body).toMatchObject({
        nombre: 'Router de prueba',
        categoria: null,
        categoriaId: null,
        tipo: null,
        tipoId: null,
        marca: null,
        modelo: null,
        compatibilidad: null,
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
        prestados: 0,
        disponibles: null,
        nivel: null,
      });
    });

    it('acepta null explícito y trata los textos vacíos como null', async () => {
      const { body } = await post({
        nombre: 'Con nulos',
        categoriaId: null,
        tipoId: null,
        marca: '   ',
        modelo: '',
        compatibilidad: '  ',
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
      }).expect(201);
      expect(body).toMatchObject({
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

    it.each([
      ['nombre vacío', { nombre: '' }],
      ['nombre de solo espacios', { nombre: '   ' }],
      ['sin nombre', { marca: 'HP' }],
      ['nombre null', { nombre: null }],
      ['stock negativo', { nombre: 'A', stockActual: -1 }],
      ['stock decimal', { nombre: 'A', stockMinimo: 1.5 }],
      ['esRetornable que no es booleano', { nombre: 'A', esRetornable: 'si' }],
      ['un campo no permitido', { nombre: 'A', id: 7 }],
      ['la categoría como texto (ahora es categoriaId)', { nombre: 'A', categoria: 'Redes' }],
      ['categoriaId que no es un número', { nombre: 'A', categoriaId: 'redes' }],
      ['marca de más de 80 caracteres', { nombre: 'A', marca: 'x'.repeat(81) }],
      ['modelo de más de 80 caracteres', { nombre: 'A', modelo: 'x'.repeat(81) }],
      [
        'compatibilidad de más de 255 caracteres',
        { nombre: 'A', compatibilidad: 'x'.repeat(256) },
      ],
    ])('responde 400 con %s', async (_caso, cuerpo) => {
      await post(cuerpo).expect(400);
    });

    it('responde 400 si la categoría no existe', async () => {
      await post({ nombre: 'A', categoriaId: 99999 }).expect(400);
    });

    it('responde 400 si el tipo no existe', async () => {
      const categoriaId = await idCategoria(app, 'Redes');
      await post({ nombre: 'A', categoriaId, tipoId: 99999 }).expect(400);
    });

    it('responde 400 si el tipo no pertenece a la categoría elegida', async () => {
      const categoriaId = await idCategoria(app, 'Redes');
      const tipoDeImpresoras = await idTipo(app, 'Impresoras', 'Tóner');
      const { body } = await post({
        nombre: 'A',
        categoriaId,
        tipoId: tipoDeImpresoras,
      }).expect(400);
      expect(body.message).toContain('no pertenece');
    });

    it('responde 400 si se elige un tipo sin categoría', async () => {
      const tipoId = await idTipo(app, 'Impresoras', 'Tóner');
      await post({ nombre: 'A', tipoId }).expect(400);
    });

    it('responde 409 si el nombre ya existe', async () => {
      await crearArticulo(app, { nombre: 'Cable' });
      await post({ nombre: 'Cable' }).expect(409);
    });
  });

  describe('PATCH /api/articulos/:id', () => {
    it('actualiza campos y devuelve el artículo', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        stockActual: 3,
        stockMinimo: 5,
      });
      const { body } = await patch(a.id, {
        stockActual: 8,
        marca: 'Epson',
        modelo: 'EB-X06',
      }).expect(200);
      expect(body).toMatchObject({
        stockActual: 8,
        marca: 'Epson',
        modelo: 'EB-X06',
        nivel: null,
      });
    });

    it('permite dejar en null categoría, tipo, marca, modelo, compatibilidad, uso y stocks', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Cable',
        categoriaId: await idCategoria(app, 'Redes'),
        tipoId: await idTipo(app, 'Redes', 'Cable de red'),
        marca: 'Furukawa',
        modelo: 'Cat6',
        compatibilidad: 'Uso interior',
        esRetornable: false,
        stockActual: 3,
        stockMinimo: 5,
      });
      const { body } = await patch(a.id, {
        categoriaId: null,
        tipoId: null,
        marca: null,
        modelo: null,
        compatibilidad: null,
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
      }).expect(200);
      expect(body).toMatchObject({
        categoria: null,
        categoriaId: null,
        tipo: null,
        tipoId: null,
        marca: null,
        modelo: null,
        compatibilidad: null,
        esRetornable: null,
        stockActual: null,
        stockMinimo: null,
        disponibles: null,
        nivel: null,
      });
    });

    it('cambia categoría y tipo juntos', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Insumo',
        categoriaId: await idCategoria(app, 'Redes'),
        tipoId: await idTipo(app, 'Redes', 'Cable de red'),
      });
      const { body } = await patch(a.id, {
        categoriaId: await idCategoria(app, 'Impresoras'),
        tipoId: await idTipo(app, 'Impresoras', 'Tinta'),
      }).expect(200);
      expect(body).toMatchObject({ categoria: 'Impresoras', tipo: 'Tinta' });
    });

    it('cambia solo el tipo dentro de la misma categoría', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Insumo',
        categoriaId: await idCategoria(app, 'Impresoras'),
        tipoId: await idTipo(app, 'Impresoras', 'Tinta'),
      });
      const { body } = await patch(a.id, {
        tipoId: await idTipo(app, 'Impresoras', 'Cartuchos'),
      }).expect(200);
      expect(body).toMatchObject({ categoria: 'Impresoras', tipo: 'Cartuchos' });
    });

    it('responde 400 si se cambia solo la categoría y el tipo actual es de otra', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Insumo',
        categoriaId: await idCategoria(app, 'Redes'),
        tipoId: await idTipo(app, 'Redes', 'Cable de red'),
      });
      await patch(a.id, {
        categoriaId: await idCategoria(app, 'Impresoras'),
      }).expect(400);
    });

    it('permite cambiar el tipo (uso) si el artículo no tiene historial', async () => {
      const a = await crearArticulo(app, { nombre: 'Cable', esRetornable: false });
      const { body } = await patch(a.id, { esRetornable: true }).expect(200);
      expect(body.esRetornable).toBe(true);
    });

    it('R1: rechaza cambiar el uso si tiene préstamos', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 2,
      });
      await crearPrestamo(app, { articuloId: a.id });
      await patch(a.id, { esRetornable: false }).expect(409);
    });

    it('R1: rechaza cambiar el uso si tiene movimientos', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Pilas',
        esRetornable: false,
        stockActual: 5,
      });
      await crearMovimiento(app, { articuloId: a.id });
      await patch(a.id, { esRetornable: true }).expect(409);
    });

    it('R1: reenviar el mismo uso no es un cambio, aunque haya historial', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 2,
      });
      await crearPrestamo(app, { articuloId: a.id });
      await patch(a.id, { esRetornable: true, marca: 'Epson' }).expect(200);
    });

    it('R2: rechaza dejar el stock por debajo de lo prestado y acepta igualarlo', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 4,
        stockMinimo: 1,
      });
      await crearPrestamo(app, { articuloId: a.id, cantidad: 3 });
      await patch(a.id, { stockActual: 2 }).expect(409);
      await patch(a.id, { stockActual: 3 }).expect(200);
    });

    it('R2: no deja el stock sin dato (null) si hay unidades prestadas', async () => {
      const a = await crearArticulo(app, {
        nombre: 'Proyector',
        esRetornable: true,
        stockActual: 4,
      });
      await crearPrestamo(app, { articuloId: a.id, cantidad: 1 });
      await patch(a.id, { stockActual: null }).expect(409);
    });

    it('responde 404 si no existe', async () => {
      await patch(9999, { stockActual: 1 }).expect(404);
    });

    it('responde 409 si el nuevo nombre ya existe', async () => {
      await crearArticulo(app, { nombre: 'Cable' });
      const b = await crearArticulo(app, { nombre: 'Pilas' });
      await patch(b.id, { nombre: 'Cable' }).expect(409);
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
