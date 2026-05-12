import { Module } from '@nestjs/common';
import { PosIntegrationController } from './pos-integration.controller';
import { PosIntegrationService } from './pos-integration.service';
import { PosIntegrationRepository } from './pos-integration.repository';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PosIntegrationController],
  providers: [PosIntegrationService, PosIntegrationRepository],
  exports: [PosIntegrationService],
})
export class PosIntegrationModule {}
