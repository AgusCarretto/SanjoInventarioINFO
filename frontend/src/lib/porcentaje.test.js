import { describe, expect, it } from 'vitest';
import { porcentajeStock } from './porcentaje.js';

describe('porcentajeStock', () => {
  it('es 0 si el stock es 0', () => expect(porcentajeStock(0, 5)).toBe(0));
  it('es proporcional al mínimo', () => expect(porcentajeStock(3, 5)).toBe(60));
  it('llega a 100 justo en el mínimo', () => expect(porcentajeStock(5, 5)).toBe(100));
  it('nunca pasa de 100', () => expect(porcentajeStock(9, 5)).toBe(100));
  it('es 0 si el mínimo es 0', () => {
    expect(porcentajeStock(0, 0)).toBe(0);
    expect(porcentajeStock(3, 0)).toBe(0);
  });
});
