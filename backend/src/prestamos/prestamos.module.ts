import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from './prestamo.entity.js';
import { PrestamosController } from './prestamos.controller.js';
import { PrestamosService } from './prestamos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Prestamo])],
  controllers: [PrestamosController],
  providers: [PrestamosService],
})
export class PrestamosModule {}
