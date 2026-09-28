import { describe, expect, it } from 'vitest';
import { elegibilidadParaReponer } from './reponerArticulo.js';

const base = { esRetornable: false, stockActual: 0 };

describe('elegibilidadParaReponer', () => {
  it('un consumible con stock cargado se puede reponer, incluso en 0', () => {
    expect(elegibilidadParaReponer(base)).toEqual({ puede: true });
  });

  it('un retornable no se puede reponer', () => {
    expect(elegibilidadParaReponer({ ...base, esRetornable: true })).toMatchObject({ puede: false });
  });

  it('un artículo sin uso definido no se puede reponer', () => {
    expect(elegibilidadParaReponer({ ...base, esRetornable: null })).toMatchObject({ puede: false });
  });

  it('sin stock cargado (null) no se puede reponer', () => {
    expect(elegibilidadParaReponer({ ...base, stockActual: null })).toMatchObject({ puede: false });
  });
});
