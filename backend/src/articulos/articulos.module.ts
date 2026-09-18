import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../catalogo/categoria.entity.js';
import { TipoArticulo } from '../catalogo/tipo-articulo.entity.js';
import { Movimiento } from '../movimientos/movimiento.entity.js';
import { Prestamo } from '../prestamos/prestamo.entity.js';
import { Articulo } from './articulo.entity.js';
import { ArticulosController } from './articulos.controller.js';
import { ArticulosService } from './articulos.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Articulo,
      Prestamo,
      Movimiento,
      Categoria,
      TipoArticulo,
    ]),
  ],
  controllers: [ArticulosController],
  providers: [ArticulosService],
  exports: [ArticulosService],
})
export class ArticulosModule {}
