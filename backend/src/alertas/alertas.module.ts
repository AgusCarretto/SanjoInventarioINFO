import { Module } from '@nestjs/common';
import { ArticulosModule } from '../articulos/articulos.module.js';
import { AlertasController } from './alertas.controller.js';
import { AlertasService } from './alertas.service.js';

@Module({
  imports: [ArticulosModule],
  controllers: [AlertasController],
  providers: [AlertasService],
})
export class AlertasModule {}
