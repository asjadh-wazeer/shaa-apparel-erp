import { Module } from '@nestjs/common';
import { CostingController } from './costing.controller';
import { CostingService } from './costing.service';
import { CostingRepository } from './costing.repository';

@Module({
  controllers: [CostingController],
  providers: [CostingService, CostingRepository],
  exports: [CostingService, CostingRepository],
})
export class CostingModule {}
