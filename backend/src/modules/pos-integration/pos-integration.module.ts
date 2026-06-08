import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { PosIntegrationController } from './pos-integration.controller';
import { PosIntegrationService } from './pos-integration.service';
import { PosIntegrationRepository } from './pos-integration.repository';
import { PosSyncService } from './pos-sync.service';
import { PosSyncProcessor } from './pos-sync.processor';
import { PrismaModule } from '../../database/prisma.module';
import { QUEUE_NAMES } from '../../common/constants';

@Module({
  imports: [
    PrismaModule,
    BullModule.registerQueue({ name: QUEUE_NAMES.POS_SYNC }),
  ],
  controllers: [PosIntegrationController],
  providers: [
    PosIntegrationService,
    PosIntegrationRepository,
    PosSyncService,
    PosSyncProcessor,
  ],
  exports: [PosIntegrationService],
})
export class PosIntegrationModule {}
