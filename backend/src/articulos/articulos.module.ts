import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from '../prestamos/prestamo.entity.js';
import { Articulo } from './articulo.entity.js';
import { ArticulosController } from './articulos.controller.js';
import { ArticulosService } from './articulos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo, Prestamo])],
  controllers: [ArticulosController],
  providers: [ArticulosService],
  exports: [ArticulosService],
})
export class ArticulosModule {}
