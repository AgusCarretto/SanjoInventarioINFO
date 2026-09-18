import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { TipoArticulo } from './tipo-articulo.entity.js';

/**
 * Opciones de la lista desplegable "Categoría". Se editan con SQL
 * (ver backend/sql/catalogo-editar.sql), no desde la aplicación.
 */
@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 60, unique: true })
  nombre: string;

  /** Menor va primero. "Otros" usa 99 para quedar siempre al final. */
  @Column({ type: 'int', default: 0 })
  orden: number;

  @OneToMany(() => TipoArticulo, (tipo) => tipo.categoria)
  tipos: Relation<TipoArticulo[]>;
}
