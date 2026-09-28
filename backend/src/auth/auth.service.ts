import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { USUARIOS } from './usuarios.js';

/**
 * Solo para los e2e: un usuario de prueba que no toca la lista real de
 * arriba, así el hash de las contraseñas reales no hace falta conocerlo
 * (ni escribirlo en texto plano) para poder testear el login.
 */
const USUARIO_DE_TEST =
  process.env.NODE_ENV === 'test'
    ? { usuario: 'test', hash: '$2b$10$YYG1oYB1vLykOYv3pEGx9OAUAUJlJZB4FQHJ34yBBExHjwW2R1Djm' }
    : null;

@Injectable()
export class AuthService {
  /** Devuelve true si el usuario existe y la contraseña coincide. */
  async validar(usuario: string, password: string): Promise<boolean> {
    const encontrado =
      USUARIOS.find((u) => u.usuario === usuario) ??
      (USUARIO_DE_TEST?.usuario === usuario ? USUARIO_DE_TEST : null);
    if (!encontrado) return false;
    return bcrypt.compare(password, encontrado.hash);
  }
}
