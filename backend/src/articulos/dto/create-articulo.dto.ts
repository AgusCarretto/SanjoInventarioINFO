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
 * Que la categoría y el tipo existan, y que el tipo pertenezca a la categoría,
 * lo verifica el servicio contra el catálogo.
 */
export class CreateArticuloDto {
  @Transform(recortar)
  @IsString({ message: 'El nombre tiene que ser un texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre puede tener hasta 120 caracteres' })
  nombre: string;

  @IsOptional()
  @IsInt({ message: 'La categoría no es válida' })
  @Min(1, { message: 'La categoría no es válida' })
  categoriaId?: number | null;

  @IsOptional()
  @IsInt({ message: 'El tipo no es válido' })
  @Min(1, { message: 'El tipo no es válido' })
  tipoId?: number | null;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'La marca tiene que ser un texto' })
  @MaxLength(80, { message: 'La marca puede tener hasta 80 caracteres' })
  marca?: string | null;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'El modelo tiene que ser un texto' })
  @MaxLength(80, { message: 'El modelo puede tener hasta 80 caracteres' })
  modelo?: string | null;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'La compatibilidad tiene que ser un texto' })
  @MaxLength(255, {
    message: 'La compatibilidad puede tener hasta 255 caracteres',
  })
  compatibilidad?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'El uso tiene que ser retornable o consumible' })
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
