import { Injectable } from '@nestjs/common';
import { ArticulosService } from '../articulos/articulos.service.js';
import { AlertaStockItem, AlertasStockRespuesta } from './alertas.types.js';

/** SIN_STOCK primero, después mayor faltante, después nombre. */
function porSeveridad(a: AlertaStockItem, b: AlertaStockItem): number {
  if (a.nivel !== b.nivel) return a.nivel === 'SIN_STOCK' ? -1 : 1;
  if (a.faltante !== b.faltante) return b.faltante - a.faltante;
  return a.nombre.localeCompare(b.nombre, 'es');
}

@Injectable()
export class AlertasService {
  constructor(private readonly articulos: ArticulosService) {}

  async obtenerAlertasDeStock(): Promise<AlertasStockRespuesta> {
    const lista = await this.articulos.listarConDisponibilidad();
    // Un nivel solo existe si hay stock actual y mínimo; se comprueba también
    // acá para que TypeScript sepa que ambos son números.
    const items: AlertaStockItem[] = lista.flatMap((a) =>
      a.nivel === null || a.stockActual === null || a.stockMinimo === null
        ? []
        : [
            {
              id: a.id,
              nombre: a.nombre,
              categoria: a.categoria,
              esRetornable: a.esRetornable,
              stockActual: a.stockActual,
              stockMinimo: a.stockMinimo,
              faltante: a.stockMinimo - a.stockActual,
              nivel: a.nivel,
              prestados: a.prestados,
              disponibles: a.stockActual - a.prestados,
            },
          ],
    );
    items.sort(porSeveridad);
    const sinStock = items.filter((i) => i.nivel === 'SIN_STOCK').length;
    return {
      generadoEn: new Date().toISOString(),
      resumen: {
        total: items.length,
        sinStock,
        bajos: items.length - sinStock,
      },
      items,
    };
  }
}
