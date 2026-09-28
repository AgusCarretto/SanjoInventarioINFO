import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Ingresá el usuario' })
  @MinLength(1, { message: 'Ingresá el usuario' })
  usuario: string;

  @IsString({ message: 'Ingresá la contraseña' })
  @MinLength(1, { message: 'Ingresá la contraseña' })
  password: string;
}
