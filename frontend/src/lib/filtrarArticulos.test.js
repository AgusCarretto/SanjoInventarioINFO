import { describe, expect, it } from 'vitest';
import { filtrarArticulos } from './filtrarArticulos.js';

const lista = [
  { id: 1, nombre: 'Tóner HP', modelo: '26A', compatibilidad: 'LaserJet Pro M402' },
  { id: 2, nombre: 'Tóner Epson', modelo: '664', compatibilidad: 'L355, L365' },
  { id: 3, nombre: 'Mouse USB', modelo: null, compatibilidad: null },
];

describe('filtrarArticulos', () => {
  it('sin texto devuelve la lista completa', () => {
    expect(filtrarArticulos(lista, '')).toEqual(lista);
    expect(filtrarArticulos(lista, '   ')).toEqual(lista);
  });

  it('busca por nombre, sin importar mayúsculas', () => {
    expect(filtrarArticulos(lista, 'mouse').map((a) => a.id)).toEqual([3]);
    expect(filtrarArticulos(lista, 'TÓNER').map((a) => a.id)).toEqual([1, 2]);
  });

  it('busca por modelo', () => {
    expect(filtrarArticulos(lista, '26a').map((a) => a.id)).toEqual([1]);
  });

  it('busca por compatibilidad', () => {
    expect(filtrarArticulos(lista, 'l365').map((a) => a.id)).toEqual([2]);
  });

  it('no falla con artículos que tienen modelo o compatibilidad en null', () => {
    expect(filtrarArticulos(lista, 'usb').map((a) => a.id)).toEqual([3]);
  });

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(filtrarArticulos(lista, 'inexistente')).toEqual([]);
  });

  it('una lista vacía devuelve una lista vacía', () => {
    expect(filtrarArticulos([], 'algo')).toEqual([]);
  });
});
