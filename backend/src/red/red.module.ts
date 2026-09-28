import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigRed } from './config-red.entity.js';
import { EquipoRed } from './equipo-red.entity.js';
import { RedController } from './red.controller.js';
import { RedService } from './red.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EquipoRed, ConfigRed])],
  controllers: [RedController],
  providers: [RedService],
})
export class RedModule {}
