/** Busca por nombre, modelo o compatibilidad, sin distinguir mayúsculas ni acentos de caja. */
export function filtrarArticulos(articulos, texto) {
  const buscado = texto.trim().toLocaleLowerCase('es');
  if (buscado === '') return articulos;
  return articulos.filter((articulo) =>
    [articulo.nombre, articulo.modelo, articulo.compatibilidad].some((campo) =>
      campo?.toLocaleLowerCase('es').includes(buscado),
    ),
  );
}
