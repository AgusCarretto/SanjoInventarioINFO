// El formulario maneja todo como texto (así son los campos); la API espera números,
// booleanos y null. Estas dos funciones hacen la traducción en ambos sentidos.

const TIPOS = { consumible: false, retornable: true };

function texto(valor) {
  return valor === null || valor === undefined ? '' : String(valor);
}

function numeroOpcional(valor) {
  const limpio = valor.trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isNaN(numero) ? null : numero;
}

/** Valores del formulario para un artículo existente, o vacíos si es uno nuevo. */
export function valoresIniciales(articulo) {
  let tipo = '';
  if (articulo?.esRetornable === true) tipo = 'retornable';
  if (articulo?.esRetornable === false) tipo = 'consumible';
  return {
    nombre: articulo?.nombre ?? '',
    categoria: texto(articulo?.categoria),
    tipo,
    stockActual: texto(articulo?.stockActual),
    stockMinimo: texto(articulo?.stockMinimo),
  };
}

/** Cuerpo para la API: lo que se deja vacío viaja como null (solo el nombre es obligatorio). */
export function armarPayload(valores) {
  const categoria = valores.categoria.trim();
  return {
    nombre: valores.nombre.trim(),
    categoria: categoria === '' ? null : categoria,
    esRetornable: Object.hasOwn(TIPOS, valores.tipo) ? TIPOS[valores.tipo] : null,
    stockActual: numeroOpcional(valores.stockActual),
    stockMinimo: numeroOpcional(valores.stockMinimo),
  };
}
