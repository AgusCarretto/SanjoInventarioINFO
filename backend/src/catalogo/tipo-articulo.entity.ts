import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  Unique,
} from 'typeorm';
import { Categoria } from './categoria.entity.js';

/**
 * Opciones de la lista desplegable "Tipo", que depende de la categoría elegida.
 * Borrar una categoría sin uso borra también sus tipos.
 */
@Entity('tipos_articulo')
@Unique(['categoriaId', 'nombre'])
export class TipoArticulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'categoria_id', type: 'int' })
  categoriaId: number;

  @ManyToOne(() => Categoria, (categoria) => categoria.tipos, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria>;

  @Column({ type: 'varchar', length: 80 })
  nombre: string;

  /** Menor va primero. "Otros" usa 99 para quedar siempre al final. */
  @Column({ type: 'int', default: 0 })
  orden: number;
}
