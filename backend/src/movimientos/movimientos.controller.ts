import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CreateMovimientoDto } from './dto/create-movimiento.dto.js';
import { MovimientosService } from './movimientos.service.js';

@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly servicio: MovimientosService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  crear(@Body() dto: CreateMovimientoDto) {
    return this.servicio.crear(dto);
  }
}
