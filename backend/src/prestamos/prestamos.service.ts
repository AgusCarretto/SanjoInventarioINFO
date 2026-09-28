import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Articulo } from '../articulos/articulo.entity.js';
import { CreatePrestamoDto } from './dto/create-prestamo.dto.js';
import { EstadoPrestamo, Prestamo } from './prestamo.entity.js';

function conArticulo(p: Prestamo) {
  return {
    id: p.id,
    articuloId: p.articuloId,
    articulo: { id: p.articulo.id, nombre: p.articulo.nombre, marca: p.articulo.marca, modelo: p.articulo.modelo },
    cantidad: p.cantidad,
    prestadoA: p.prestadoA,
    fechaSalida: p.fechaSalida,
  };
}

/**
 * R4/R5 del spec: en un retornable, `stock_actual` es directamente lo
 * disponible para prestar (no hay "prestados"/"disponibles" separados).
 * Prestar resta, devolver suma; ambos con lock pesimista sobre el artículo.
 */
@Injectable()
export class PrestamosService {
  constructor(
    @InjectRepository(Prestamo)
    private readonly prestamos: Repository<Prestamo>,
    private readonly dataSource: DataSource,
  ) {}

  /** Solo lo que está actualmente prestado (ACTIVO); lo devuelto pasa a figurar en Movimientos. */
  async listar() {
    const filas = await this.prestamos.find({
      where: { estado: EstadoPrestamo.ACTIVO },
      relations: { articulo: true },
      order: { fechaSalida: 'DESC', id: 'DESC' },
    });
    return filas.map(conArticulo);
  }

  async prestar(dto: CreatePrestamoDto) {
    const cantidad = dto.cantidad ?? 1;
    let creado!: Prestamo;

    await this.dataSource.transaction(async (manager) => {
      const articulo = await manager.findOne(Articulo, {
        where: { id: dto.articuloId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!articulo) {
        throw new NotFoundException(`No existe el artículo ${dto.articuloId}`);
      }
      if (articulo.esRetornable === null) {
        throw new ConflictException(
          'Definí el uso del artículo (retornable) antes de registrar un préstamo',
        );
      }
      if (!articulo.esRetornable) {
        throw new ConflictException(
          'El artículo es consumible: se usa y se gasta, no se presta',
        );
      }
      if (articulo.stockActual === null) {
        throw new ConflictException(
          'El artículo no tiene stock cargado: completalo antes de prestarlo',
        );
      }
      if (cantidad > articulo.stockActual) {
        throw new ConflictException(
          `No hay disponibles suficientes: quedan ${articulo.stockActual}`,
        );
      }

      articulo.stockActual -= cantidad;
      await manager.save(Articulo, articulo);
      creado = await manager.save(
        Prestamo,
        manager.create(Prestamo, {
          articuloId: dto.articuloId,
          cantidad,
          prestadoA: dto.prestadoA,
        }),
      );
      creado.articulo = articulo;
    });

    return conArticulo(creado);
  }

  async devolver(id: number) {
    await this.dataSource.transaction(async (manager) => {
      const prestamo = await manager.findOneBy(Prestamo, { id });
      if (!prestamo) throw new NotFoundException(`No existe el préstamo ${id}`);
      if (prestamo.estado === EstadoPrestamo.DEVUELTO) {
        throw new ConflictException('Este préstamo ya estaba devuelto');
      }

      const articulo = await manager.findOne(Articulo, {
        where: { id: prestamo.articuloId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!articulo) {
        throw new NotFoundException(`No existe el artículo ${prestamo.articuloId}`);
      }

      prestamo.estado = EstadoPrestamo.DEVUELTO;
      prestamo.fechaDevolucionReal = new Date();
      articulo.stockActual = (articulo.stockActual ?? 0) + prestamo.cantidad;
      await manager.save(Articulo, articulo);
      await manager.save(Prestamo, prestamo);
    });
  }
}
