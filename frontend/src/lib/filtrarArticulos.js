/**
 * Busca por nombre, modelo, compatibilidad o a quién le sirve (ej. el nombre de
 * una persona: "Laura" encuentra el tóner que ella usa), sin distinguir mayúsculas.
 */
export function filtrarArticulos(articulos, texto) {
  const buscado = texto.trim().toLocaleLowerCase('es');
  if (buscado === '') return articulos;
  return articulos.filter((articulo) =>
    [articulo.nombre, articulo.modelo, articulo.compatibilidad, articulo.paraQuienes].some(
      (campo) => campo?.toLocaleLowerCase('es').includes(buscado),
    ),
  );
}
