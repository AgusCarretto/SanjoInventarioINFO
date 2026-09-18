import { describe, expect, it } from 'vitest';
import { armarPayload, valoresIniciales } from './articuloForm.js';

const vacio = { nombre: '', categoria: '', tipo: '', stockActual: '', stockMinimo: '' };

describe('valoresIniciales', () => {
  it('sin artículo devuelve todo vacío', () => {
    expect(valoresIniciales(null)).toEqual(vacio);
  });

  it('un artículo con datos vacíos (null) deja los campos vacíos', () => {
    const articulo = { nombre: 'Solo nombre', categoria: null, esRetornable: null, stockActual: null, stockMinimo: null };
    expect(valoresIniciales(articulo)).toEqual({ ...vacio, nombre: 'Solo nombre' });
  });

  it('pasa los datos a texto, como los manejan los campos del formulario', () => {
    const articulo = { nombre: 'Proyector', categoria: 'Equipos', esRetornable: true, stockActual: 4, stockMinimo: 2 };
    expect(valoresIniciales(articulo)).toEqual({
      nombre: 'Proyector',
      categoria: 'Equipos',
      tipo: 'retornable',
      stockActual: '4',
      stockMinimo: '2',
    });
  });

  it('un cero es un dato, no un campo vacío', () => {
    const articulo = { nombre: 'Cables', categoria: null, esRetornable: false, stockActual: 0, stockMinimo: 0 };
    const valores = valoresIniciales(articulo);
    expect(valores.tipo).toBe('consumible');
    expect(valores.stockActual).toBe('0');
    expect(valores.stockMinimo).toBe('0');
  });
});

describe('armarPayload', () => {
  it('con solo el nombre manda todo lo demás como null', () => {
    expect(armarPayload({ ...vacio, nombre: 'Router' })).toEqual({
      nombre: 'Router',
      categoria: null,
      esRetornable: null,
      stockActual: null,
      stockMinimo: null,
    });
  });

  it('recorta espacios del nombre y de la categoría', () => {
    const payload = armarPayload({ ...vacio, nombre: '  Mouse USB ', categoria: '  Periféricos  ' });
    expect(payload.nombre).toBe('Mouse USB');
    expect(payload.categoria).toBe('Periféricos');
  });

  it('una categoría de solo espacios pasa a null', () => {
    expect(armarPayload({ ...vacio, nombre: 'X', categoria: '   ' }).categoria).toBeNull();
  });

  it('traduce el tipo a booleano', () => {
    expect(armarPayload({ ...vacio, nombre: 'X', tipo: 'retornable' }).esRetornable).toBe(true);
    expect(armarPayload({ ...vacio, nombre: 'X', tipo: 'consumible' }).esRetornable).toBe(false);
    expect(armarPayload({ ...vacio, nombre: 'X', tipo: '' }).esRetornable).toBeNull();
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
