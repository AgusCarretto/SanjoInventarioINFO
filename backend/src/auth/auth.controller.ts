import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from './public.decorator.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly servicio: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Req() request: Request) {
    const valido = await this.servicio.validar(dto.usuario, dto.password);
    if (!valido) throw new UnauthorizedException('Usuario o contraseña incorrectos');
    request.session.usuario = dto.usuario;
    return { usuario: dto.usuario };
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Req() request: Request): Promise<void> {
    return new Promise((resolve) => request.session.destroy(() => resolve()));
  }

  @Get('me')
  yo(@Req() request: Request) {
    return { usuario: request.session.usuario };
  }
}
