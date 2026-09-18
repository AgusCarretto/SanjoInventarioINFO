import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Categoria } from '../catalogo/categoria.entity.js';
import { TipoArticulo } from '../catalogo/tipo-articulo.entity.js';
import { Movimiento } from '../movimientos/movimiento.entity.js';
import { Prestamo } from '../prestamos/prestamo.entity.js';

@Entity('articulos')
@Check('"stock_actual" >= 0')
@Check('"stock_minimo" >= 0')
export class Articulo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120, unique: true })
  nombre: string;

  // Solo el nombre es obligatorio. Un null significa "sin dato", no cero.

  /** Categoría del catálogo. RESTRICT: no se puede borrar una categoría en uso. */
  @Column({ name: 'categoria_id', type: 'int', nullable: true })
  categoriaId: number | null;

  @ManyToOne(() => Categoria, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Relation<Categoria> | null;

  /** Tipo del catálogo (Cartuchos, Tóner, Mouse...). Depende de la categoría. */
  @Column({ name: 'tipo_id', type: 'int', nullable: true })
  tipoId: number | null;

  @ManyToOne(() => TipoArticulo, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'tipo_id' })
  tipo: Relation<TipoArticulo> | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  marca: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  modelo: string | null;

  /** Texto libre: con qué equipos o modelos es compatible (ej. un tóner). */
  @Column({ type: 'varchar', length: 255, nullable: true })
  compatibilidad: string | null;

  /** Uso: true = retornable (se presta y se devuelve), false = consumible, null = sin definir. */
  @Column({ name: 'es_retornable', type: 'boolean', nullable: true })
  esRetornable: boolean | null;

  /** Total del colegio. No baja al prestar: lo prestado se calcula aparte. */
  @Column({ name: 'stock_actual', type: 'int', nullable: true })
  stockActual: number | null;

  @Column({ name: 'stock_minimo', type: 'int', nullable: true })
  stockMinimo: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Prestamo, (prestamo) => prestamo.articulo)
  prestamos: Relation<Prestamo[]>;

  @OneToMany(() => Movimiento, (movimiento) => movimiento.articulo)
  movimientos: Relation<Movimiento[]>;
}
