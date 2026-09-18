-- =====================================================================
-- EDITAR EL CATÁLOGO (categorías y tipos)
--
-- NO corras este archivo entero. Es un recetario: copiá SOLO el bloque
-- que necesites, cambiá los textos entre comillas simples y ejecutalo
-- en pgAdmin (Query Tool, base InventarioInformatica).
--
-- Con psql:
--   & "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -d InventarioInformatica -f archivo.sql
--
-- Los cambios se ven en el formulario apenas recargás la página; no hace
-- falta reiniciar nada.
--
-- Reglas de la base (te protegen de romper cosas):
--   * No se puede repetir una categoría, ni un tipo dentro de la misma categoría.
--   * No se puede borrar una categoría o un tipo que tenga artículos.
--   * Renombrar es seguro: los artículos siguen apuntando al mismo registro.
--   * La columna "orden" manda: menor va primero. "Otros" usa 99 (siempre al final).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1) VER TODO EL CATÁLOGO (este bloque es solo de lectura)
-- ---------------------------------------------------------------------
SELECT c.orden AS orden_cat, c.nombre AS categoria, t.orden AS orden_tipo, t.nombre AS tipo
FROM categorias c
LEFT JOIN tipos_articulo t ON t.categoria_id = c.id
ORDER BY c.orden, c.nombre, t.orden, t.nombre;


-- ---------------------------------------------------------------------
-- 2) AGREGAR UNA CATEGORÍA NUEVA
--    (orden 5 la deja después de Redes y antes de Otros)
-- ---------------------------------------------------------------------
-- INSERT INTO categorias (nombre, orden) VALUES ('Software', 5);


-- ---------------------------------------------------------------------
-- 3) AGREGAR UN TIPO A UNA CATEGORÍA
--    Cambiá 'Redes' por la categoría y 'Antena' por el tipo nuevo.
-- ---------------------------------------------------------------------
-- INSERT INTO tipos_articulo (categoria_id, nombre, orden)
-- SELECT id, 'Antena', 10 FROM categorias WHERE nombre = 'Redes';

-- Varios tipos de una vez en la misma categoría:
-- INSERT INTO tipos_articulo (categoria_id, nombre, orden)
-- SELECT c.id, t.nombre, t.orden
-- FROM categorias c, (VALUES ('Antena', 10), ('Crimpeadora', 11)) AS t(nombre, orden)
-- WHERE c.nombre = 'Redes';


-- ---------------------------------------------------------------------
-- 4) RENOMBRAR UNA CATEGORÍA
-- ---------------------------------------------------------------------
-- UPDATE categorias SET nombre = 'Conectividad' WHERE nombre = 'Redes';


-- ---------------------------------------------------------------------
-- 5) RENOMBRAR UN TIPO
--    Los artículos que lo usan se actualizan solos.
-- ---------------------------------------------------------------------
-- UPDATE tipos_articulo SET nombre = 'Cable UTP'
-- WHERE nombre = 'Cable de red'
--   AND categoria_id = (SELECT id FROM categorias WHERE nombre = 'Redes');


-- ---------------------------------------------------------------------
-- 6) CAMBIAR EL ORDEN EN QUE SE MUESTRAN
-- ---------------------------------------------------------------------
-- UPDATE categorias SET orden = 1 WHERE nombre = 'Impresoras';
-- UPDATE tipos_articulo SET orden = 1
-- WHERE nombre = 'Switch'
--   AND categoria_id = (SELECT id FROM categorias WHERE nombre = 'Redes');


-- ---------------------------------------------------------------------
-- 7) BORRAR UN TIPO
--    Falla si algún artículo lo usa. En ese caso, primero pasá esos
--    artículos a otro tipo con el bloque 9 y volvé a probar.
-- ---------------------------------------------------------------------
-- DELETE FROM tipos_articulo
-- WHERE nombre = 'Hub USB'
--   AND categoria_id = (SELECT id FROM categorias WHERE nombre = 'Periféricos');


-- ---------------------------------------------------------------------
-- 8) BORRAR UNA CATEGORÍA (borra también sus tipos)
--    Falla si algún artículo usa la categoría o alguno de sus tipos.
-- ---------------------------------------------------------------------
-- DELETE FROM categorias WHERE nombre = 'Software';


-- ---------------------------------------------------------------------
-- 9) PASAR LOS ARTÍCULOS DE UN TIPO A OTRO (dentro de la misma categoría)
--    Útil antes de borrar un tipo que está en uso.
-- ---------------------------------------------------------------------
-- UPDATE articulos
-- SET tipo_id = (SELECT t.id FROM tipos_articulo t JOIN categorias c ON c.id = t.categoria_id
--                WHERE c.nombre = 'Periféricos' AND t.nombre = 'Otros')
-- WHERE tipo_id = (SELECT t.id FROM tipos_articulo t JOIN categorias c ON c.id = t.categoria_id
--                  WHERE c.nombre = 'Periféricos' AND t.nombre = 'Hub USB');


-- ---------------------------------------------------------------------
-- 10) QUÉ ARTÍCULOS USAN CADA CATEGORÍA Y TIPO (solo lectura)
-- ---------------------------------------------------------------------
-- SELECT c.nombre AS categoria, t.nombre AS tipo, count(*) AS articulos
-- FROM articulos a
-- LEFT JOIN categorias c ON c.id = a.categoria_id
-- LEFT JOIN tipos_articulo t ON t.id = a.tipo_id
-- GROUP BY c.nombre, t.nombre
-- ORDER BY c.nombre, t.nombre;
