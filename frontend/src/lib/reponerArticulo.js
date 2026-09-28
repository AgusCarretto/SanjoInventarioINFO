/**
 * ¿Se puede registrar una entrada de stock (reponer) de este artículo? Espeja
 * las reglas del backend (MovimientosService): solo consumibles, con uso
 * definido y stock cargado (no hace falta que sea mayor a 0, al revés que
 * para usarlo). Se anticipa acá para no ofrecer un botón que va a fallar.
 */
export function elegibilidadParaReponer(articulo) {
  if (articulo.esRetornable === null) {
    return { puede: false, motivo: 'Definí el uso del artículo (Consumible) para poder registrarlo.' };
  }
  if (articulo.esRetornable === true) {
    return { puede: false, motivo: 'Es retornable: el stock se ajusta editando el artículo.' };
  }
  if (articulo.stockActual === null) {
    return { puede: false, motivo: 'No tiene stock cargado. Cargalo primero desde Editar.' };
  }
  return { puede: true };
}
