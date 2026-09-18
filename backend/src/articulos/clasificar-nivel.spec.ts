import { clasificarNivel } from './clasificar-nivel.js';

describe('clasificarNivel', () => {
  it('devuelve null si el stock supera el mínimo', () => {
    expect(clasificarNivel(6, 5)).toBeNull();
  });
  it('devuelve BAJO si el stock es igual al mínimo', () => {
    expect(clasificarNivel(5, 5)).toBe('BAJO');
  });
  it('devuelve BAJO si el stock está entre 1 y el mínimo', () => {
    expect(clasificarNivel(3, 5)).toBe('BAJO');
  });
  it('devuelve SIN_STOCK si el stock es 0', () => {
    expect(clasificarNivel(0, 5)).toBe('SIN_STOCK');
  });
  it('devuelve SIN_STOCK con mínimo 0 y stock 0', () => {
    expect(clasificarNivel(0, 0)).toBe('SIN_STOCK');
  });
  it('devuelve null con mínimo 0 y stock 1', () => {
    expect(clasificarNivel(1, 0)).toBeNull();
  });
});
