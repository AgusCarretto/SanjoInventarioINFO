import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movimiento } from './movimiento.entity.js';

@Module({ imports: [TypeOrmModule.forFeature([Movimiento])] })
export class MovimientosModule {}
