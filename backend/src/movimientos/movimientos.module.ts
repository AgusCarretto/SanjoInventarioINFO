import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticulosModule } from '../articulos/articulos.module.js';
import { Prestamo } from '../prestamos/prestamo.entity.js';
import { Movimiento } from './movimiento.entity.js';
import { MovimientosController } from './movimientos.controller.js';
import { MovimientosService } from './movimientos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento, Prestamo]), ArticulosModule],
  controllers: [MovimientosController],
  providers: [MovimientosService],
})
export class MovimientosModule {}
