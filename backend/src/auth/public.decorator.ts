import { SetMetadata } from '@nestjs/common';

export const CLAVE_PUBLICA = 'esPublica';

/** Marca una ruta como accesible sin sesión iniciada (login, y poco más). */
export const Public = () => SetMetadata(CLAVE_PUBLICA, true);
