import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
} from 'typeorm';
import { Articulo } from '../articulos/articulo.entity.js';

export enum EstadoPrestamo {
  ACTIVO = 'ACTIVO',
  DEVUELTO = 'DEVUELTO',
}

@Entity('prestamos')
@Check('"cantidad" >= 1')
export class Prestamo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'articulo_id', type: 'int' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.prestamos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Relation<Articulo>;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ name: 'prestado_a', type: 'varchar', length: 120 })
  prestadoA: string;

  @Column({ name: 'fecha_salida', type: 'timestamptz', default: () => 'now()' })
  fechaSalida: Date;

  /** 'AAAA-MM-DD' (columna date). */
  @Column({ name: 'fecha_devolucion_esperada', type: 'date' })
  fechaDevolucionEsperada: string;

  @Column({ name: 'fecha_devolucion_real', type: 'timestamptz', nullable: true })
  fechaDevolucionReal: Date | null;

  @Column({
    type: 'enum',
    enum: EstadoPrestamo,
    enumName: 'estado_prestamo',
    default: EstadoPrestamo.ACTIVO,
  })
  estado: EstadoPrestamo;
}
