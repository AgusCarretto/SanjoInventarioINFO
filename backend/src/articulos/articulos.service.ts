import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../catalogo/categoria.entity.js';
import { TipoArticulo } from '../catalogo/tipo-articulo.entity.js';
import { Movimiento } from '../movimientos/movimiento.entity.js';
import { EstadoPrestamo, Prestamo } from '../prestamos/prestamo.entity.js';
import {
  ArticuloConDisponibilidad,
  conDisponibilidad,
} from './articulo-con-disponibilidad.js';
import { Articulo } from './articulo.entity.js';
import { CreateArticuloDto } from './dto/create-articulo.dto.js';
import { UpdateArticuloDto } from './dto/update-articulo.dto.js';

/** Relaciones que hace falta cargar para mostrar el nombre de la categoría y del tipo. */
const RELACIONES = { categoria: true, tipo: true } as const;

@Injectable()
export class ArticulosService {
  constructor(
    @InjectRepository(Articulo)
    private readonly articulos: Repository<Articulo>,
    @InjectRepository(Prestamo)
    private readonly prestamos: Repository<Prestamo>,
    @InjectRepository(Movimiento)
    private readonly movimientos: Repository<Movimiento>,
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
    @InjectRepository(TipoArticulo)
    private readonly tipos: Repository<TipoArticulo>,
  ) {}

  /** ¿Tiene préstamos (activos o devueltos) o movimientos registrados? */
  private async tieneHistorial(articuloId: number): Promise<boolean> {
    const [prestamos, movimientos] = await Promise.all([
      this.prestamos.count({ where: { articuloId } }),
      this.movimientos.count({ where: { articuloId } }),
    ]);
    return prestamos + movimientos > 0;
  }

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

  /**
   * La categoría y el tipo tienen que existir en el catálogo, y el tipo tiene
   * que pertenecer a esa categoría (no se puede elegir un tipo sin categoría).
   */
  private async validarReferencias(
    categoriaId: number | null,
    tipoId: number | null,
  ): Promise<void> {
    if (
      categoriaId !== null &&
      !(await this.categorias.existsBy({ id: categoriaId }))
    ) {
      throw new BadRequestException('La categoría elegida no existe');
    }
    if (tipoId === null) return;
    if (categoriaId === null) {
      throw new BadRequestException(
        'Para elegir un tipo primero elegí una categoría',
      );
    }
    const tipo = await this.tipos.findOneBy({ id: tipoId });
    if (!tipo) throw new BadRequestException('El tipo elegido no existe');
    if (tipo.categoriaId !== categoriaId) {
      throw new BadRequestException(
        'El tipo elegido no pertenece a la categoría',
      );
    }
  }

  /** Ordenados por el orden de la categoría en el catálogo, después por nombre; sin categoría al final. */
  async listarConDisponibilidad(): Promise<ArticuloConDisponibilidad[]> {
    const [lista, prestados] = await Promise.all([
      this.articulos.find({
        relations: RELACIONES,
        order: {
          categoria: { orden: 'ASC', nombre: 'ASC' },
          nombre: 'ASC',
        },
      }),
      this.prestadosPorArticulo(),
    ]);
    return lista.map((a) => conDisponibilidad(a, prestados.get(a.id) ?? 0));
  }

  async obtener(id: number): Promise<ArticuloConDisponibilidad> {
    const articulo = await this.articulos.findOne({
      where: { id },
      relations: RELACIONES,
    });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    const prestados = (await this.prestadosPorArticulo()).get(id) ?? 0;
    return conDisponibilidad(articulo, prestados);
  }

  async crear(dto: CreateArticuloDto): Promise<ArticuloConDisponibilidad> {
    await this.validarReferencias(dto.categoriaId ?? null, dto.tipoId ?? null);
    let id: number;
    try {
      id = (await this.articulos.save(this.articulos.create(dto))).id;
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
    return this.obtener(id);
  }

  async actualizar(
    id: number,
    dto: UpdateArticuloDto,
  ): Promise<ArticuloConDisponibilidad> {
    // Sin relaciones cargadas: al guardar, TypeORM usa las columnas categoria_id y tipo_id.
    const articulo = await this.articulos.findOneBy({ id });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    const prestados = (await this.prestadosPorArticulo()).get(id) ?? 0;

    // Se valida el resultado final: cambiar solo la categoría no puede dejar un tipo ajeno.
    await this.validarReferencias(
      dto.categoriaId !== undefined ? dto.categoriaId : articulo.categoriaId,
      dto.tipoId !== undefined ? dto.tipoId : articulo.tipoId,
    );

    // R1: el uso (retornable/consumible) se puede editar, pero no si ya hay historial.
    if (
      dto.esRetornable !== undefined &&
      dto.esRetornable !== articulo.esRetornable &&
      (await this.tieneHistorial(id))
    ) {
      throw new ConflictException(
        'El artículo ya tiene préstamos o movimientos: no se puede cambiar su uso (retornable o consumible)',
      );
    }
    // R2: el total nunca puede quedar por debajo de lo que está prestado
    // (y dejarlo sin dato equivale a perder ese total).
    if (dto.stockActual !== undefined) {
      if (dto.stockActual === null) {
        if (prestados > 0) {
          throw new ConflictException(
            `No se puede dejar el stock sin dato: hay ${prestados} unidades prestadas`,
          );
        }
      } else if (dto.stockActual < prestados) {
        throw new ConflictException(
          `No se puede dejar el stock en ${dto.stockActual}: hay ${prestados} unidades prestadas`,
        );
      }
    }
    Object.assign(articulo, dto);
    try {
      await this.articulos.save(articulo);
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
    return this.obtener(id);
  }

  async eliminar(id: number): Promise<void> {
    const articulo = await this.articulos.findOneBy({ id });
    if (!articulo) throw new NotFoundException(`No existe el artículo ${id}`);
    try {
      await this.articulos.remove(articulo); // R3: la FK RESTRICT frena si hay historial
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
  }

  /**
   * Traduce a 409 las violaciones de UNIQUE (23505) y de la FK del historial:
   * con ON DELETE RESTRICT Postgres informa 23001 (restrict_violation); 23503
   * (foreign_key_violation) se cubre por si la FK llegara a ser NO ACTION.
   */
  private traducirErrorDeBase(error: unknown): unknown {
    const codigo = (error as { driverError?: { code?: string } })?.driverError
      ?.code;
    if (codigo === '23505') {
      return new ConflictException('Ya existe un artículo con ese nombre');
    }
    if (codigo === '23001' || codigo === '23503') {
      return new ConflictException(
        'El artículo tiene préstamos o movimientos y no se puede eliminar',
      );
    }
    return error;
  }
}
