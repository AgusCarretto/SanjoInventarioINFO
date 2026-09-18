import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ArticulosService } from './articulos.service.js';

@Controller('articulos')
export class ArticulosController {
  constructor(private readonly servicio: ArticulosService) {}

  @Get()
  listar() {
    return this.servicio.listarConDisponibilidad();
  }

  @Get(':id')
  obtener(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.obtener(id);
  }
}
