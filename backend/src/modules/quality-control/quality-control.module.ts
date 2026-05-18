import { Module } from '@nestjs/common';
import { QualityControlController } from './quality-control.controller';
import { QualityControlService } from './quality-control.service';
import { QualityControlRepository } from './quality-control.repository';
import { PrismaModule } from '../../database/prisma.module';
import { FileManagementModule } from '../file-management/file-management.module';

@Module({
  imports: [PrismaModule, FileManagementModule],
  controllers: [QualityControlController],
  providers: [QualityControlService, QualityControlRepository],
  exports: [QualityControlService],
})
export class QualityControlModule {}
