import { Transform } from 'class-transformer';
import { IsIP, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const textoOpcional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class CreateEquipoRedDto {
  @IsString({ message: 'El nombre es obligatorio' })
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre puede tener hasta 120 caracteres' })
  nombre: string;

  @IsIP('4', { message: 'La IP no es válida' })
  ip: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsIP('4', { message: 'La puerta de enlace no es válida' })
  puertaEnlace?: string | null;
}
