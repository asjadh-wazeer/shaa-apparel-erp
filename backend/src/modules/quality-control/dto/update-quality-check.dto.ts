import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateQualityCheckDto } from './create-quality-check.dto';

export class UpdateQualityCheckDto extends PartialType(
  OmitType(CreateQualityCheckDto, ['productionOrderId', 'checkNumber', 'defects'] as const),
) {}
