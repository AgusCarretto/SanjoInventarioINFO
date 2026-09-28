import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ArticuloConDisponibilidad } from '../articulos/articulo-con-disponibilidad.js';
import { Articulo } from '../articulos/articulo.entity.js';
import { ArticulosService } from '../articulos/articulos.service.js';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity.js';
import { CreateMovimientoDto } from './dto/create-movimiento.dto.js';
import { Movimiento, TipoMovimiento } from './movimiento.entity.js';

export interface ItemHistorial {
  id: number;
  origen: 'movimiento' | 'prestamo';
  fecha: Date;
  tipo: TipoMovimiento | 'DEVOLUCION';
  cantidad: number;
  detalle: string | null;
  articulo: { id: number; nombre: string; marca: string | null; modelo: string | null };
}

/**
 * R6 del spec: los movimientos son solo para artículos no retornables.
 * El stock de un retornable se toca por préstamo/devolución, no por movimiento.
 */
@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento)
    private readonly movimientos: Repository<Movimiento>,
    @InjectRepository(Prestamo)
    private readonly prestamos: Repository<Prestamo>,
    private readonly articulos: ArticulosService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Historial completo, más reciente primero: entradas y salidas de
   * consumibles más las devoluciones de préstamos (un préstamo devuelto deja
   * de figurar en Préstamos y pasa a ser un evento más acá).
   */
  async listar(): Promise<ItemHistorial[]> {
    const [movimientos, devoluciones] = await Promise.all([
      this.movimientos.find({
        relations: { articulo: true },
        order: { fecha: 'DESC', id: 'DESC' },
      }),
      this.prestamos.find({
        where: { estado: EstadoPrestamo.DEVUELTO },
        relations: { articulo: true },
      }),
    ]);

    const itemsMovimiento: ItemHistorial[] = movimientos.map((m) => ({
      id: m.id,
      origen: 'movimiento',
      fecha: m.fecha,
      tipo: m.tipo,
      cantidad: m.cantidad,
      detalle: m.detalle,
      articulo: { id: m.articulo.id, nombre: m.articulo.nombre, marca: m.articulo.marca, modelo: m.articulo.modelo },
    }));
    const itemsDevolucion: ItemHistorial[] = devoluciones.map((p) => ({
      id: p.id,
      origen: 'prestamo',
      fecha: p.fechaDevolucionReal!,
      tipo: 'DEVOLUCION',
      cantidad: p.cantidad,
      detalle: `Devuelto por ${p.prestadoA}`,
      articulo: { id: p.articulo.id, nombre: p.articulo.nombre, marca: p.articulo.marca, modelo: p.articulo.modelo },
    }));

    return [...itemsMovimiento, ...itemsDevolucion].sort(
      (a, b) => b.fecha.getTime() - a.fecha.getTime(),
    );
  }

  async crear(dto: CreateMovimientoDto): Promise<ArticuloConDisponibilidad> {
    const cantidad = dto.cantidad ?? 1;

    await this.dataSource.transaction(async (manager) => {
      // Lock pesimista: dos movimientos simultáneos sobre el mismo artículo
      // no pueden dejar el stock negativo ni pisarse entre sí.
      const articulo = await manager.findOne(Articulo, {
        where: { id: dto.articuloId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!articulo) {
        throw new NotFoundException(`No existe el artículo ${dto.articuloId}`);
      }
      if (articulo.esRetornable === null) {
        throw new ConflictException(
          'Definí el uso del artículo (consumible) antes de registrar movimientos',
        );
      }
      if (articulo.esRetornable) {
        throw new ConflictException(
          'El artículo es retornable: se presta y se devuelve, no se registra como movimiento',
        );
      }
      if (articulo.stockActual === null) {
        throw new ConflictException(
          'El artículo no tiene stock cargado: completalo antes de registrar movimientos',
        );
      }

      const nuevoStock =
        dto.tipo === TipoMovimiento.SALIDA
          ? articulo.stockActual - cantidad
          : articulo.stockActual + cantidad;
      if (nuevoStock < 0) {
        throw new ConflictException(
          `No hay stock suficiente: quedan ${articulo.stockActual} unidades`,
        );
      }

      articulo.stockActual = nuevoStock;
      await manager.save(Articulo, articulo);
      await manager.save(
        Movimiento,
        manager.create(Movimiento, {
          articuloId: dto.articuloId,
          tipo: dto.tipo,
          cantidad,
          detalle: dto.detalle ?? null,
        }),
      );
    });

    return this.articulos.obtener(dto.articuloId);
  }
}
