import { Articulo } from './articulo.entity.js';
import { clasificarNivel, NivelAlerta } from './clasificar-nivel.js';

export interface ArticuloConDisponibilidad {
  id: number;
  nombre: string;
  /** Nombre de la categoría del catálogo (null si no tiene). */
  categoria: string | null;
  categoriaId: number | null;
  /** Nombre del tipo del catálogo (null si no tiene). */
  tipo: string | null;
  tipoId: number | null;
  marca: string | null;
  modelo: string | null;
  compatibilidad: string | null;
  /** A quién le sirve, ej. nombres de personas que usan ese tóner. Texto libre. */
  paraQuienes: string | null;
  esRetornable: boolean | null;
  stockActual: number | null;
  stockMinimo: number | null;
  /** Unidades con préstamo ACTIVO (0 en no retornables). Informativo: en un
   * retornable, `stock_actual` ya es lo disponible para prestar (baja al
   * prestar, sube al devolver). */
  prestados: number;
  nivel: NivelAlerta | null;
  createdAt: Date;
  updatedAt: Date;
}

/** Requiere el artículo cargado con las relaciones `categoria` y `tipo`. */
export function conDisponibilidad(
  articulo: Articulo,
  prestados: number,
): ArticuloConDisponibilidad {
  return {
    id: articulo.id,
    nombre: articulo.nombre,
    categoria: articulo.categoria?.nombre ?? null,
    categoriaId: articulo.categoriaId,
    tipo: articulo.tipo?.nombre ?? null,
    tipoId: articulo.tipoId,
    marca: articulo.marca,
    modelo: articulo.modelo,
    compatibilidad: articulo.compatibilidad,
    paraQuienes: articulo.paraQuienes,
    esRetornable: articulo.esRetornable,
    stockActual: articulo.stockActual,
    stockMinimo: articulo.stockMinimo,
    prestados,
    nivel: clasificarNivel(articulo.stockActual, articulo.stockMinimo),
    createdAt: articulo.createdAt,
    updatedAt: articulo.updatedAt,
  };
}
