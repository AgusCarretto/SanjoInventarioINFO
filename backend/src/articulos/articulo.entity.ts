import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
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
  @Column({ type: 'varchar', length: 60, nullable: true })
  categoria: string | null;

  /** null = tipo sin definir todavía. */
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
