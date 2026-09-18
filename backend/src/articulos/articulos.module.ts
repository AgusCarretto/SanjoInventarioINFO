import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prestamo } from '../prestamos/prestamo.entity.js';
import { Articulo } from './articulo.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Articulo, Prestamo])],
})
export class ArticulosModule {}
