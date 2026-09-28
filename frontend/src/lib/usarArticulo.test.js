import { describe, expect, it } from 'vitest';
import { elegibilidadParaUsar } from './usarArticulo.js';

const base = { esRetornable: false, stockActual: 5 };

describe('elegibilidadParaUsar', () => {
  it('un consumible con stock cargado y mayor a 0 se puede usar', () => {
    expect(elegibilidadParaUsar(base)).toEqual({ puede: true });
  });

  it('un retornable no se puede usar', () => {
    expect(elegibilidadParaUsar({ ...base, esRetornable: true })).toMatchObject({
      puede: false,
    });
  });

  it('un artículo sin uso definido no se puede usar', () => {
    expect(elegibilidadParaUsar({ ...base, esRetornable: null })).toMatchObject({
      puede: false,
    });
  });

  it('sin stock cargado (null) no se puede usar', () => {
    expect(elegibilidadParaUsar({ ...base, stockActual: null })).toMatchObject({
      puede: false,
    });
  });

  it('con stock en 0 no se puede usar', () => {
    expect(elegibilidadParaUsar({ ...base, stockActual: 0 })).toMatchObject({
      puede: false,
    });
  });

  it('cada motivo de bloqueo trae una explicación', () => {
    const casos = [
      { ...base, esRetornable: true },
      { ...base, esRetornable: null },
      { ...base, stockActual: null },
      { ...base, stockActual: 0 },
    ];
    for (const articulo of casos) {
      const resultado = elegibilidadParaUsar(articulo);
      expect(resultado.puede).toBe(false);
      expect(typeof resultado.motivo).toBe('string');
      expect(resultado.motivo.length).toBeGreaterThan(0);
    }
  });
});
