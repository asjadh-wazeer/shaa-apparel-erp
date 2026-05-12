import { PartialType } from '@nestjs/swagger';
import { CreateCostingConfigDto } from './create-costing-config.dto';

export class UpdateCostingConfigDto extends PartialType(CreateCostingConfigDto) {}
