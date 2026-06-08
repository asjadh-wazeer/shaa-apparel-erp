import { Module } from '@nestjs/common';
import { FinishedGoodsController } from './finished-goods.controller';
import { FinishedGoodsService } from './finished-goods.service';
import { FinishedGoodsRepository } from './finished-goods.repository';
import { PrismaModule } from '../../database/prisma.module';
import { PosIntegrationModule } from '../pos-integration/pos-integration.module';

@Module({
  imports: [PrismaModule, PosIntegrationModule],
  controllers: [FinishedGoodsController],
  providers: [FinishedGoodsService, FinishedGoodsRepository],
  exports: [FinishedGoodsService],
})
export class FinishedGoodsModule {}
