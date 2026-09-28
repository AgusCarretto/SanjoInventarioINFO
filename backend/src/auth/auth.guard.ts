import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { CLAVE_PUBLICA } from './public.decorator.js';

/** Global: sin sesión iniciada, cualquier ruta no marcada con @Public() responde 401. */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const esPublica = this.reflector.getAllAndOverride<boolean>(CLAVE_PUBLICA, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (esPublica) return true;

    const request = context.switchToHttp().getRequest<Request>();
    if (!request.session?.usuario) {
      throw new UnauthorizedException('Iniciá sesión para continuar');
    }
    return true;
  }
}
