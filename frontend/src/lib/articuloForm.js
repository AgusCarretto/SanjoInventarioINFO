// El formulario maneja todo como texto (así son los campos); la API espera números,
// booleanos y null. Estas funciones hacen la traducción en ambos sentidos.

const USOS = { consumible: false, retornable: true };

function texto(valor) {
  return valor === null || valor === undefined ? '' : String(valor);
}

function textoOpcional(valor) {
  const limpio = valor.trim();
  return limpio === '' ? null : limpio;
}

function numeroOpcional(valor) {
  const limpio = valor.trim();
  if (limpio === '') return null;
  const numero = Number(limpio);
  return Number.isNaN(numero) ? null : numero;
}

/** Valores del formulario para un artículo existente, o vacíos si es uno nuevo. */
export function valoresIniciales(articulo) {
  let uso = '';
  if (articulo?.esRetornable === true) uso = 'retornable';
  if (articulo?.esRetornable === false) uso = 'consumible';
  return {
    nombre: articulo?.nombre ?? '',
    categoriaId: texto(articulo?.categoriaId),
    tipoId: texto(articulo?.tipoId),
    marca: texto(articulo?.marca),
    modelo: texto(articulo?.modelo),
    compatibilidad: texto(articulo?.compatibilidad),
    uso,
    stockActual: texto(articulo?.stockActual),
    stockMinimo: texto(articulo?.stockMinimo),
  };
}

/** Cuerpo para la API: lo que se deja vacío viaja como null (solo el nombre es obligatorio). */
export function armarPayload(valores) {
  return {
    nombre: valores.nombre.trim(),
    categoriaId: numeroOpcional(valores.categoriaId),
    tipoId: numeroOpcional(valores.tipoId),
    marca: textoOpcional(valores.marca),
    modelo: textoOpcional(valores.modelo),
    compatibilidad: textoOpcional(valores.compatibilidad),
    esRetornable: Object.hasOwn(USOS, valores.uso) ? USOS[valores.uso] : null,
    stockActual: numeroOpcional(valores.stockActual),
    stockMinimo: numeroOpcional(valores.stockMinimo),
  };
}

/** Tipos de la categoría elegida (el id llega como texto desde el select). Vacío si no hay. */
export function tiposDeCategoria(catalogo, categoriaId) {
  const categoria = catalogo?.categorias?.find((c) => String(c.id) === String(categoriaId));
  return categoria?.tipos ?? [];
}
