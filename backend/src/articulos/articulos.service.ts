import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity.js';
import {
  ArticuloConDisponibilidad,
  conDisponibilidad,
} from './articulo-con-disponibilidad.js';
import { Articulo } from './articulo.entity.js';

@Injectable()
export class ArticulosService {
  constructor(
    @InjectRepository(Articulo)
    private readonly articulos: Repository<Articulo>,
    @InjectRepository(Prestamo)
    private readonly prestamos: Repository<Prestamo>,
  ) {}

  /** Unidades en préstamo ACTIVO, por artículo. */
  private async prestadosPorArticulo(): Promise<Map<number, number>> {
    const filas = await this.prestamos
      .createQueryBuilder('p')
      .select('p.articuloId', 'articuloId')
      .addSelect('SUM(p.cantidad)', 'prestados')
      .where('p.estado = :estado', { estado: EstadoPrestamo.ACTIVO })
      .groupBy('p.articuloId')
      .getRawMany<{ articuloId: number; prestados: string }>();
    return new Map(
      filas.map((f) => [Number(f.articuloId), Number(f.prestados)]),
    );
  }

  async listarConDisponibilidad(): Promise<ArticuloConDisponibilidad[]> {
    const [lista, prestados] = await Promise.all([
      this.articulos.find({ order: { categoria: 'ASC', nombre: 'ASC' } }),
      this.prestadosPorArticulo(),
    ]);
    return lista.map((a) => conDisponibilidad(a, prestados.get(a.id) ?? 0));
  }

  async obtener(id: number): Promise<ArticuloConDisponibilidad> {
    const articulo = await this.articulos.findOneBy({ id });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    const prestados = (await this.prestadosPorArticulo()).get(id) ?? 0;
    return conDisponibilidad(articulo, prestados);
  }
}
