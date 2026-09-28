import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { TipoMovimiento } from '../movimiento.entity.js';

const textoOpcional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class CreateMovimientoDto {
  @IsInt({ message: 'El artículo no es válido' })
  @Min(1, { message: 'El artículo no es válido' })
  articuloId: number;

  @IsEnum(TipoMovimiento, {
    message: 'El tipo tiene que ser ENTRADA o SALIDA',
  })
  tipo: TipoMovimiento;

  /** Por defecto 1: alcanza para el uso más común, "usar una unidad". */
  @IsOptional()
  @IsInt({ message: 'La cantidad tiene que ser un número entero' })
  @Min(1, { message: 'La cantidad tiene que ser al menos 1' })
  cantidad?: number;

  @IsOptional()
  @Transform(textoOpcional)
  @IsString({ message: 'El detalle tiene que ser un texto' })
  detalle?: string | null;
}
