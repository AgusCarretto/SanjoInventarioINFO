import { Column, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

/** Un puesto/PC de la red del colegio con IP fija (planilla "IPs colegio"). */
@Entity('equipos_red')
@Unique(['ip'])
export class EquipoRed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 120 })
  nombre: string;

  @Column({ type: 'varchar', length: 45 })
  ip: string;

  @Column({ name: 'puerta_enlace', type: 'varchar', length: 45, nullable: true })
  puertaEnlace: string | null;
}
