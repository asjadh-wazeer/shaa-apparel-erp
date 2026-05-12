import { PartialType } from '@nestjs/swagger';
import { CreateGarmentTypeDto } from './create-garment-type.dto';

export class UpdateGarmentTypeDto extends PartialType(CreateGarmentTypeDto) {}
