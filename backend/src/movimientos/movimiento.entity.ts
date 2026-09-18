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

export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
}

@Entity('movimientos')
@Check('"cantidad" >= 1')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'articulo_id', type: 'int' })
  articuloId: number;

  @ManyToOne(() => Articulo, (articulo) => articulo.movimientos, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'articulo_id' })
  articulo: Relation<Articulo>;

  @Column({ type: 'enum', enum: TipoMovimiento, enumName: 'tipo_movimiento' })
  tipo: TipoMovimiento;

  @Column({ type: 'int' })
  cantidad: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  detalle: string | null;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  fecha: Date;
}
