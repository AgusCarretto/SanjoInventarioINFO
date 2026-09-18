import { Articulo } from './articulo.entity.js';
import { clasificarNivel, NivelAlerta } from './clasificar-nivel.js';

export interface ArticuloConDisponibilidad {
  id: number;
  nombre: string;
  categoria: string;
  esRetornable: boolean;
  stockActual: number;
  stockMinimo: number;
  prestados: number;
  disponibles: number;
  nivel: NivelAlerta | null;
  createdAt: Date;
  updatedAt: Date;
}

export function conDisponibilidad(
  articulo: Articulo,
  prestados: number,
): ArticuloConDisponibilidad {
  return {
    id: articulo.id,
    nombre: articulo.nombre,
    categoria: articulo.categoria,
    esRetornable: articulo.esRetornable,
    stockActual: articulo.stockActual,
    stockMinimo: articulo.stockMinimo,
    prestados,
    disponibles: articulo.stockActual - prestados,
    nivel: clasificarNivel(articulo.stockActual, articulo.stockMinimo),
    createdAt: articulo.createdAt,
    updatedAt: articulo.updatedAt,
  };
}
