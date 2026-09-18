import { NivelAlerta } from '../articulos/clasificar-nivel.js';

export interface AlertaStockItem {
  id: number;
  nombre: string;
  categoria: string | null;
  tipo: string | null;
  marca: string | null;
  modelo: string | null;
  compatibilidad: string | null;
  esRetornable: boolean | null;
  stockActual: number;
  stockMinimo: number;
  /** stock_minimo − stock_actual; 0 si está justo en el mínimo. */
  faltante: number;
  nivel: NivelAlerta;
  prestados: number;
  disponibles: number;
}

export interface AlertasStockRespuesta {
  generadoEn: string;
  resumen: { total: number; sinStock: number; bajos: number };
  items: AlertaStockItem[];
}
