import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigRed } from './config-red.entity.js';
import { CreateEquipoRedDto } from './dto/create-equipo-red.dto.js';
import { UpdateConfigRedDto } from './dto/update-config-red.dto.js';
import { UpdateEquipoRedDto } from './dto/update-equipo-red.dto.js';
import { EquipoRed } from './equipo-red.entity.js';

const ID_CONFIG = 1;

@Injectable()
export class RedService {
  constructor(
    @InjectRepository(EquipoRed)
    private readonly equipos: Repository<EquipoRed>,
    @InjectRepository(ConfigRed)
    private readonly config: Repository<ConfigRed>,
  ) {}

  listarEquipos(): Promise<EquipoRed[]> {
    return this.equipos.find({ order: { nombre: 'ASC' } });
  }

  async crearEquipo(dto: CreateEquipoRedDto): Promise<EquipoRed> {
    try {
      return await this.equipos.save(this.equipos.create(dto));
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
  }

  async actualizarEquipo(id: number, dto: UpdateEquipoRedDto): Promise<EquipoRed> {
    const equipo = await this.equipos.findOneBy({ id });
    if (!equipo) throw new NotFoundException(`No existe el equipo ${id}`);
    Object.assign(equipo, dto);
    try {
      return await this.equipos.save(equipo);
    } catch (error) {
      throw this.traducirErrorDeBase(error);
    }
  }

  async eliminarEquipo(id: number): Promise<void> {
    const equipo = await this.equipos.findOneBy({ id });
    if (!equipo) throw new NotFoundException(`No existe el equipo ${id}`);
    await this.equipos.remove(equipo);
  }

  async obtenerConfig(): Promise<Omit<ConfigRed, 'id'>> {
    const actual = await this.config.findOneBy({ id: ID_CONFIG });
    return { dns: actual?.dns ?? null, dnsAlternativo: actual?.dnsAlternativo ?? null };
  }

  async actualizarConfig(dto: UpdateConfigRedDto): Promise<Omit<ConfigRed, 'id'>> {
    const actual = (await this.config.findOneBy({ id: ID_CONFIG })) ?? this.config.create({ id: ID_CONFIG });
    Object.assign(actual, dto);
    await this.config.save(actual);
    return { dns: actual.dns, dnsAlternativo: actual.dnsAlternativo };
  }

  private traducirErrorDeBase(error: unknown): unknown {
    const codigo = (error as { driverError?: { code?: string } })?.driverError?.code;
    if (codigo === '23505') {
      return new ConflictException('Ya existe un equipo con esa IP');
    }
    return error;
  }
}
