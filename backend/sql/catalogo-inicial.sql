-- =====================================================================
-- CATÁLOGO INICIAL
-- Categorías y tipos que aparecen en las listas desplegables del
-- formulario de artículos.
--
-- Se puede correr las veces que haga falta: si una categoría o un tipo
-- ya existe, lo saltea y no duplica nada.
-- OJO: si RENOMBRASTE algo con catalogo-editar.sql, este archivo vuelve
-- a crear el nombre original. Correlo solo en una instalación nueva.
--
-- Cómo correrlo:
--   * Desde la carpeta backend:  npm run catalogo
--   * O pegarlo en pgAdmin (Query Tool) conectado a InventarioInformatica.
--
-- La columna "orden" define en qué orden se muestran (menor va primero).
-- "Otros" lleva 99 para que quede siempre al final de cada lista.
-- =====================================================================

-- Este archivo está guardado en UTF-8. Esta línea se lo avisa a psql aunque tu
-- terminal de Windows use otra codificación (sin ella, las tildes se guardan rotas).
SET client_encoding = 'UTF8';

INSERT INTO categorias (nombre, orden) VALUES
  ('Periféricos',    1),
  ('Componentes PC', 2),
  ('Impresoras',     3),
  ('Redes',          4),
  ('Otros',         99)
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO tipos_articulo (categoria_id, nombre, orden)
SELECT c.id, t.nombre, t.orden
FROM (VALUES
  ('Periféricos', 'Mouse',                  1),
  ('Periféricos', 'Teclado',                2),
  ('Periféricos', 'Monitor',                3),
  ('Periféricos', 'Auriculares',            4),
  ('Periféricos', 'Parlantes',              5),
  ('Periféricos', 'Micrófono',              6),
  ('Periféricos', 'Webcam',                 7),
  ('Periféricos', 'Pendrive',               8),
  ('Periféricos', 'Hub USB',                9),
  ('Periféricos', 'Otros',                 99),

  ('Componentes PC', 'Procesador',              1),
  ('Componentes PC', 'Placa madre',             2),
  ('Componentes PC', 'Memoria RAM',             3),
  ('Componentes PC', 'Disco rígido',            4),
  ('Componentes PC', 'Disco sólido (SSD)',      5),
  ('Componentes PC', 'Fuente de alimentación',  6),
  ('Componentes PC', 'Placa de video',          7),
  ('Componentes PC', 'Gabinete',                8),
  ('Componentes PC', 'Cooler',                  9),
  ('Componentes PC', 'Batería de notebook',    10),
  ('Componentes PC', 'Cargador de notebook',   11),
  ('Componentes PC', 'Otros',                  99),

  ('Impresoras', 'Cartuchos',    1),
  ('Impresoras', 'Tóner',        2),
  ('Impresoras', 'Tinta',        3),
  ('Impresoras', 'Impresora',    4),
  ('Impresoras', 'Componentes',  5),
  ('Impresoras', 'Otros',       99),

  ('Redes', 'Cable de red',     1),
  ('Redes', 'Conector RJ45',    2),
  ('Redes', 'Patch cord',       3),
  ('Redes', 'Switch',          4),
  ('Redes', 'Router',           5),
  ('Redes', 'Access point',     6),
  ('Redes', 'Patch panel',      7),
  ('Redes', 'Placa de red',     8),
  ('Redes', 'Otros',          99),

  ('Otros', 'Proyector',                     1),
  ('Otros', 'Notebook',                      2),
  ('Otros', 'Cable de video (HDMI, VGA)',    3),
  ('Otros', 'Pilas y baterías',              4),
  ('Otros', 'Adaptador',                     5),
  ('Otros', 'Herramienta',                   6),
  ('Otros', 'Otros',                        99)
) AS t(categoria, nombre, orden)
JOIN categorias c ON c.nombre = t.categoria
ON CONFLICT (categoria_id, nombre) DO NOTHING;
