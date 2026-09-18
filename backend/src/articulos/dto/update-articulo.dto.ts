import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateArticuloDto } from './create-articulo.dto.js';

// R1: esRetornable no se puede modificar después de crear el artículo.
export class UpdateArticuloDto extends PartialType(
  OmitType(CreateArticuloDto, ['esRetornable'] as const),
) {}
