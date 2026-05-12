import { PartialType } from '@nestjs/swagger';
import { CreateFinishedGoodDto } from './create-finished-good.dto';

export class UpdateFinishedGoodDto extends PartialType(CreateFinishedGoodDto) {}
