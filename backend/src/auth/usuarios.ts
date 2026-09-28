/**
 * Login simple, sin alta ni gestión de usuarios: solo estas 2 personas.
 * Las contraseñas viven acá como hash (bcrypt), nunca en texto plano.
 * Para agregar o cambiar una, generar el hash y editar esta lista a mano.
 */
export interface Usuario {
  usuario: string;
  hash: string;
}

export const USUARIOS: readonly Usuario[] = [
  { usuario: 'agus', hash: '$2b$10$TOyQOTkPKojV3mssFtbj1OW29m/yvWmImuN/VYRnGvKMX8JXXaDza' },
  { usuario: 'seba', hash: '$2b$10$T9I8FMFu3BWEZssIaag9ReXHuijhWvi8etDxUQnpJu4WR7pZP8ZDu' },
];
