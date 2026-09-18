import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogoController } from './catalogo.controller.js';
import { CatalogoService } from './catalogo.service.js';
import { Categoria } from './categoria.entity.js';
import { TipoArticulo } from './tipo-articulo.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, TipoArticulo])],
  controllers: [CatalogoController],
  providers: [CatalogoService],
})
export class CatalogoModule {}
