import { Controller, Get } from '@nestjs/common';
import { AlertasService } from './alertas.service.js';

@Controller('alertas')
export class AlertasController {
  constructor(private readonly servicio: AlertasService) {}

  @Get('stock')
  stock() {
    return this.servicio.obtenerAlertasDeStock();
  }
}
