import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

const recortar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

/** Texto opcional: recorta espacios y un texto vacío pasa a null. */
const textoOpcional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

/**
 * Solo `nombre` es obligatorio. El resto puede omitirse o enviarse como null
 * (`@IsOptional` saltea las validaciones cuando el valor es null o undefined).
 */
export class CreateArticuloDto {
  @Transform(recortar)
  @IsString({ message: 'El nombre tiene que ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre puede tener hasta 120 caracteres' })
  nombre: string;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'La categoría tiene que ser un texto' })
  @MaxLength(60, { message: 'La categoría puede tener hasta 60 caracteres' })
  categoria?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'El tipo tiene que ser retornable o consumible' })
  esRetornable?: boolean | null;

  @IsOptional()
  @IsInt({ message: 'El stock actual tiene que ser un número entero' })
  @Min(0, { message: 'El stock actual no puede ser negativo' })
  stockActual?: number | null;

  @IsOptional()
  @IsInt({ message: 'El stock mínimo tiene que ser un número entero' })
  @Min(0, { message: 'El stock mínimo no puede ser negativo' })
  stockMinimo?: number | null;
}
