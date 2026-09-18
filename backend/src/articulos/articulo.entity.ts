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

  @Column({ type: 'varchar', length: 60 })
  categoria: string;

  @Column({ name: 'es_retornable', type: 'boolean' })
  esRetornable: boolean;

  /** Total del colegio. No baja al prestar: lo prestado se calcula aparte. */
  @Column({ name: 'stock_actual', type: 'int', default: 0 })
  stockActual: number;

  @Column({ name: 'stock_minimo', type: 'int', default: 0 })
  stockMinimo: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @OneToMany(() => Prestamo, (prestamo) => prestamo.articulo)
  prestamos: Relation<Prestamo[]>;

  @OneToMany(() => Movimiento, (movimiento) => movimiento.articulo)
  movimientos: Relation<Movimiento[]>;
}
