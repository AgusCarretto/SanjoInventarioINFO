import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreatePrestamoDto } from './dto/create-prestamo.dto.js';
import { PrestamosService } from './prestamos.service.js';

@Controller('prestamos')
export class PrestamosController {
  constructor(private readonly servicio: PrestamosService) {}

  @Get()
  listar() {
    return this.servicio.listar();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  prestar(@Body() dto: CreatePrestamoDto) {
    return this.servicio.prestar(dto);
  }

  @Patch(':id/devolver')
  devolver(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.devolver(id);
  }
}
