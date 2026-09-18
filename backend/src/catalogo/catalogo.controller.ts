import { Controller, Get } from '@nestjs/common';
import { CatalogoService } from './catalogo.service.js';

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly servicio: CatalogoService) {}

  @Get()
  obtener() {
    return this.servicio.obtener();
  }
}
