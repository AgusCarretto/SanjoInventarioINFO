/**
 * ¿Se puede registrar "usar 1 unidad" de este artículo? Espeja las reglas del
 * backend (MovimientosService): solo consumibles, con uso definido y stock
 * cargado y mayor a 0. Se anticipa acá para no ofrecer un botón que va a fallar.
 */
export function elegibilidadParaUsar(articulo) {
  if (articulo.esRetornable === null) {
    return { puede: false, motivo: 'Definí el uso del artículo (Consumible) para poder registrarlo.' };
  }
  if (articulo.esRetornable === true) {
    return { puede: false, motivo: 'Es retornable: se presta y se devuelve, no se consume.' };
  }
  if (articulo.stockActual === null) {
    return { puede: false, motivo: 'No tiene stock cargado.' };
  }
  if (articulo.stockActual <= 0) {
    return { puede: false, motivo: 'No queda stock disponible.' };
  }
  return { puede: true };
}
