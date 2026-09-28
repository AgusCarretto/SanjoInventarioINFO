import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipoRedDto } from './create-equipo-red.dto.js';

export class UpdateEquipoRedDto extends PartialType(CreateEquipoRedDto) {}
