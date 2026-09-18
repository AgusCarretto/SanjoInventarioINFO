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
  esRetornable: boolean | null;
  stockActual: number | null;
  stockMinimo: number | null;
  prestados: number;
  /** null si todavía no se cargó el stock actual. */
  disponibles: number | null;
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
    esRetornable: articulo.esRetornable,
    stockActual: articulo.stockActual,
    stockMinimo: articulo.stockMinimo,
    prestados,
    disponibles:
      articulo.stockActual === null ? null : articulo.stockActual - prestados,
    nivel: clasificarNivel(articulo.stockActual, articulo.stockMinimo),
    createdAt: articulo.createdAt,
    updatedAt: articulo.updatedAt,
  };
}
