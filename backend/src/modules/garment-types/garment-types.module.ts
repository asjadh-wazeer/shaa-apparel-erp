import { Module } from '@nestjs/common';
import { GarmentTypesController } from './garment-types.controller';
import { GarmentTypesService } from './garment-types.service';
import { GarmentTypesRepository } from './garment-types.repository';

@Module({
  controllers: [GarmentTypesController],
  providers: [GarmentTypesService, GarmentTypesRepository],
  exports: [GarmentTypesService, GarmentTypesRepository],
})
export class GarmentTypesModule {}
