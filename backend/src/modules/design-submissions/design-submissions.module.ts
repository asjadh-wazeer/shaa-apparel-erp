import { Module } from '@nestjs/common';
import { DesignSubmissionsController } from './design-submissions.controller';
import { DesignSubmissionsService } from './design-submissions.service';
import { DesignSubmissionsRepository } from './design-submissions.repository';
import { PrismaModule } from '../../database/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DesignSubmissionsController],
  providers: [DesignSubmissionsService, DesignSubmissionsRepository],
  exports: [DesignSubmissionsService],
})
export class DesignSubmissionsModule {}
