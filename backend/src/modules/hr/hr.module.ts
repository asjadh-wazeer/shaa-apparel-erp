import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { HrRepository } from './hr.repository';

@Module({
  controllers: [HrController],
  providers: [HrService, HrRepository],
  exports: [HrService, HrRepository],
})
export class HrModule {}
