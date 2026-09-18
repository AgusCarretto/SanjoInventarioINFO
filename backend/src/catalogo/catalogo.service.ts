import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from './categoria.entity.js';

export interface CatalogoRespuesta {
  categorias: {
    id: number;
    nombre: string;
    tipos: { id: number; nombre: string }[];
  }[];
}

@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categorias: Repository<Categoria>,
  ) {}

  /** Categorías con sus tipos, en el orden en que se muestran. Se lee de la base cada vez. */
  async obtener(): Promise<CatalogoRespuesta> {
    const lista = await this.categorias.find({
      relations: { tipos: true },
      order: {
        orden: 'ASC',
        nombre: 'ASC',
        tipos: { orden: 'ASC', nombre: 'ASC' },
      },
    });
    return {
      categorias: lista.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        tipos: c.tipos.map((t) => ({ id: t.id, nombre: t.nombre })),
      })),
    };
  }
}
