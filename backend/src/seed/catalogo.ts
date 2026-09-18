import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DataSource } from 'typeorm';

/** Ruta del SQL del catálogo, relativa a la carpeta backend (donde corren npm y los tests). */
export const RUTA_CATALOGO_INICIAL = join(
  process.cwd(),
  'sql',
  'catalogo-inicial.sql',
);

/**
 * Parte el archivo SQL en sentencias sueltas: saca las líneas de comentario
 * (`--`) y corta en cada `;` que cierra una línea.
 */
function separarSentencias(sql: string): string[] {
  return sql
    .split(/;\s*(?:\r?\n|$)/)
    .map((bloque) =>
      bloque
        .split(/\r?\n/)
        .filter((linea) => !linea.trim().startsWith('--'))
        .join('\n')
        .trim(),
    )
    .filter((sentencia) => sentencia !== '');
}

/**
 * Carga las categorías y tipos de `sql/catalogo-inicial.sql`. Es el mismo
 * archivo que se puede correr a mano en pgAdmin, así hay una sola fuente de
 * verdad. No duplica nada si se corre más de una vez.
 */
export async function cargarCatalogoInicial(ds: DataSource): Promise<void> {
  const sentencias = separarSentencias(
    readFileSync(RUTA_CATALOGO_INICIAL, 'utf8'),
  );
  await ds.transaction(async (manager) => {
    for (const sentencia of sentencias) {
      await manager.query(sentencia);
    }
  });
}
