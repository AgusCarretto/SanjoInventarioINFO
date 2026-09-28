import { Transform } from 'class-transformer';
import { IsIP, IsOptional } from 'class-validator';

const textoOpcional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || null : value;

export class UpdateConfigRedDto {
  @IsOptional()
  @Transform(textoOpcional)
  @IsIP('4', { message: 'El DNS no es válido' })
  dns?: string | null;

  @IsOptional()
  @Transform(textoOpcional)
  @IsIP('4', { message: 'El DNS alternativo no es válido' })
  dnsAlternativo?: string | null;
}
