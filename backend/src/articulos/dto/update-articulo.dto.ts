import { PartialType } from '@nestjs/mapped-types';
import { CreateArticuloDto } from './create-articulo.dto.js';

// Todo se puede editar. Si se cambia el tipo (esRetornable) el servicio verifica
// que el artículo no tenga préstamos ni movimientos.
export class UpdateArticuloDto extends PartialType(CreateArticuloDto) {}
