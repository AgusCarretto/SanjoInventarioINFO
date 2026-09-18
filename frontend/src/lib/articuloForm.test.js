import { describe, expect, it } from 'vitest';
import { armarPayload, tiposDeCategoria, valoresIniciales } from './articuloForm.js';

const vacio = {
  nombre: '',
  categoriaId: '',
  tipoId: '',
  marca: '',
  modelo: '',
  compatibilidad: '',
  uso: '',
  stockActual: '',
  stockMinimo: '',
};

describe('valoresIniciales', () => {
  it('sin artículo devuelve todo vacío', () => {
    expect(valoresIniciales(null)).toEqual(vacio);
  });

  it('un artículo con datos vacíos (null) deja los campos vacíos', () => {
    const articulo = {
      nombre: 'Solo nombre',
      categoriaId: null,
      tipoId: null,
      marca: null,
      modelo: null,
      compatibilidad: null,
      esRetornable: null,
      stockActual: null,
      stockMinimo: null,
    };
    expect(valoresIniciales(articulo)).toEqual({ ...vacio, nombre: 'Solo nombre' });
  });

  it('pasa los datos a texto, como los manejan los campos del formulario', () => {
    const articulo = {
      nombre: 'Tóner HP 26A',
      categoriaId: 3,
      tipoId: 22,
      marca: 'HP',
      modelo: '26A',
      compatibilidad: 'LaserJet Pro M402',
      esRetornable: false,
      stockActual: 4,
      stockMinimo: 2,
    };
    expect(valoresIniciales(articulo)).toEqual({
      nombre: 'Tóner HP 26A',
      categoriaId: '3',
      tipoId: '22',
      marca: 'HP',
      modelo: '26A',
      compatibilidad: 'LaserJet Pro M402',
      uso: 'consumible',
      stockActual: '4',
      stockMinimo: '2',
    });
  });

  it('el uso retornable se traduce y un cero es un dato, no un campo vacío', () => {
    const valores = valoresIniciales({ nombre: 'X', esRetornable: true, stockActual: 0, stockMinimo: 0 });
    expect(valores.uso).toBe('retornable');
    expect(valores.stockActual).toBe('0');
    expect(valores.stockMinimo).toBe('0');
  });
});

describe('armarPayload', () => {
  it('con solo el nombre manda todo lo demás como null', () => {
    expect(armarPayload({ ...vacio, nombre: 'Router' })).toEqual({
      nombre: 'Router',
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

  it('recorta espacios de nombre, marca, modelo y compatibilidad', () => {
    const payload = armarPayload({
      ...vacio,
      nombre: '  Mouse USB ',
      marca: '  Logitech ',
      modelo: ' M90 ',
      compatibilidad: '  Windows y Mac ',
    });
    expect(payload).toMatchObject({
      nombre: 'Mouse USB',
      marca: 'Logitech',
      modelo: 'M90',
      compatibilidad: 'Windows y Mac',
    });
  });

  it('los textos opcionales de solo espacios pasan a null', () => {
    const payload = armarPayload({ ...vacio, nombre: 'X', marca: '   ', modelo: '  ', compatibilidad: ' ' });
    expect(payload.marca).toBeNull();
    expect(payload.modelo).toBeNull();
    expect(payload.compatibilidad).toBeNull();
  });

  it('convierte la categoría y el tipo elegidos a número', () => {
    const payload = armarPayload({ ...vacio, nombre: 'X', categoriaId: '3', tipoId: '22' });
    expect(payload.categoriaId).toBe(3);
    expect(payload.tipoId).toBe(22);
  });

  it('traduce el uso a booleano', () => {
    expect(armarPayload({ ...vacio, nombre: 'X', uso: 'retornable' }).esRetornable).toBe(true);
    expect(armarPayload({ ...vacio, nombre: 'X', uso: 'consumible' }).esRetornable).toBe(false);
    expect(armarPayload({ ...vacio, nombre: 'X', uso: '' }).esRetornable).toBeNull();
  });

  it('convierte los stocks a número y respeta el cero', () => {
    const payload = armarPayload({ ...vacio, nombre: 'X', stockActual: '0', stockMinimo: '12' });
    expect(payload.stockActual).toBe(0);
    expect(payload.stockMinimo).toBe(12);
  });

  it('un stock en blanco o con solo espacios pasa a null', () => {
    const payload = armarPayload({ ...vacio, nombre: 'X', stockActual: '  ', stockMinimo: '' });
    expect(payload.stockActual).toBeNull();
    expect(payload.stockMinimo).toBeNull();
  });
});

describe('tiposDeCategoria', () => {
  const catalogo = {
    categorias: [
      { id: 1, nombre: 'Periféricos', tipos: [{ id: 10, nombre: 'Mouse' }, { id: 11, nombre: 'Teclado' }] },
      { id: 3, nombre: 'Impresoras', tipos: [{ id: 30, nombre: 'Tóner' }] },
    ],
  };

  it('devuelve los tipos de la categoría elegida (el id viene como texto del select)', () => {
    expect(tiposDeCategoria(catalogo, '3')).toEqual([{ id: 30, nombre: 'Tóner' }]);
    expect(tiposDeCategoria(catalogo, 1).map((t) => t.nombre)).toEqual(['Mouse', 'Teclado']);
  });

  it('sin categoría elegida, o con una que no existe, devuelve una lista vacía', () => {
    expect(tiposDeCategoria(catalogo, '')).toEqual([]);
    expect(tiposDeCategoria(catalogo, '99')).toEqual([]);
  });

  it('sin catálogo cargado todavía devuelve una lista vacía', () => {
    expect(tiposDeCategoria(null, '1')).toEqual([]);
    expect(tiposDeCategoria(undefined, '1')).toEqual([]);
  });
});
