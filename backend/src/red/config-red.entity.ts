import { Column, Entity, PrimaryColumn } from 'typeorm';

/** Fila única (id 1): DNS de toda la red, no por equipo. */
@Entity('config_red')
export class ConfigRed {
  @PrimaryColumn({ default: 1 })
  id: number;

  @Column({ type: 'varchar', length: 45, nullable: true })
  dns: string | null;

  @Column({ name: 'dns_alternativo', type: 'varchar', length: 45, nullable: true })
  dnsAlternativo: string | null;
}
