import { describe, expect, it } from 'vitest';
import { filtrarArticulos } from './filtrarArticulos.js';

const lista = [
  { id: 1, nombre: 'Tóner HP', modelo: '26A', compatibilidad: 'LaserJet Pro M402', paraQuienes: 'Laura, Secretaría' },
  { id: 2, nombre: 'Tóner Epson', modelo: '664', compatibilidad: 'L355, L365', paraQuienes: 'Dirección' },
  { id: 3, nombre: 'Mouse USB', modelo: null, compatibilidad: null, paraQuienes: null },
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

  it('busca por a quién le sirve (ej. el nombre de una persona)', () => {
    expect(filtrarArticulos(lista, 'laura').map((a) => a.id)).toEqual([1]);
    expect(filtrarArticulos(lista, 'dirección').map((a) => a.id)).toEqual([2]);
  });

  it('no falla con artículos que tienen modelo, compatibilidad o a quién le sirve en null', () => {
    expect(filtrarArticulos(lista, 'usb').map((a) => a.id)).toEqual([3]);
  });

  it('sin coincidencias devuelve una lista vacía', () => {
    expect(filtrarArticulos(lista, 'inexistente')).toEqual([]);
  });

  it('una lista vacía devuelve una lista vacía', () => {
    expect(filtrarArticulos([], 'algo')).toEqual([]);
  });
});
