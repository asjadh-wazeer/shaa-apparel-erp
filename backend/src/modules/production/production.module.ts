import { Module } from '@nestjs/common';
import { ProductionController } from './production.controller';
import { ProductionService } from './production.service';
import { ProductionRepository } from './production.repository';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService, ProductionRepository],
  exports: [ProductionService, ProductionRepository],
})
export class ProductionModule {}
