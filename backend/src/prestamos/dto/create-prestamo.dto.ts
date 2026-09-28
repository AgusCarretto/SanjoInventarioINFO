import { Transform } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreatePrestamoDto {
  @IsInt({ message: 'El artículo no es válido' })
  @Min(1, { message: 'El artículo no es válido' })
  articuloId: number;

  /** Por defecto 1. */
  @IsOptional()
  @IsInt({ message: 'La cantidad tiene que ser un número entero' })
  @Min(1, { message: 'La cantidad tiene que ser al menos 1' })
  cantidad?: number;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Decí a quién se le presta' })
  @MinLength(1, { message: 'Decí a quién se le presta' })
  prestadoA: string;
}
