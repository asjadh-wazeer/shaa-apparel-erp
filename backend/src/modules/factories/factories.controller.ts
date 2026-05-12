import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FactoriesService } from './factories.service';

@ApiTags('Factories')
@ApiBearerAuth()
@Controller({ path: 'factories', version: '1' })
export class FactoriesController {
  constructor(private readonly factoriesService: FactoriesService) {}
}
