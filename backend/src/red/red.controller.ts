import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CreateEquipoRedDto } from './dto/create-equipo-red.dto.js';
import { UpdateConfigRedDto } from './dto/update-config-red.dto.js';
import { UpdateEquipoRedDto } from './dto/update-equipo-red.dto.js';
import { RedService } from './red.service.js';

@Controller('red')
export class RedController {
  constructor(private readonly servicio: RedService) {}

  @Get('equipos')
  listarEquipos() {
    return this.servicio.listarEquipos();
  }

  @Post('equipos')
  crearEquipo(@Body() dto: CreateEquipoRedDto) {
    return this.servicio.crearEquipo(dto);
  }

  @Patch('equipos/:id')
  actualizarEquipo(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEquipoRedDto) {
    return this.servicio.actualizarEquipo(id, dto);
  }

  @Delete('equipos/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  eliminarEquipo(@Param('id', ParseIntPipe) id: number) {
    return this.servicio.eliminarEquipo(id);
  }

  @Get('config')
  obtenerConfig() {
    return this.servicio.obtenerConfig();
  }

  @Patch('config')
  actualizarConfig(@Body() dto: UpdateConfigRedDto) {
    return this.servicio.actualizarConfig(dto);
  }
}
