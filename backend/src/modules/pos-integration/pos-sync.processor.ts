import { Processor, Process, OnQueueFailed, OnQueueCompleted } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { QUEUE_NAMES } from '../../common/constants';
import { PosSyncService } from './pos-sync.service';

export const POS_SYNC_JOB = 'sync-inventory';

export interface PosSyncJobData {
  tenantId: string;
}

@Processor(QUEUE_NAMES.POS_SYNC)
export class PosSyncProcessor {
  private readonly logger = new Logger(PosSyncProcessor.name);

  constructor(private readonly syncService: PosSyncService) {}

  @Process(POS_SYNC_JOB)
  async handleSync(job: Job<PosSyncJobData>): Promise<void> {
    const { tenantId } = job.data;
    this.logger.log(`Processing POS sync job ${job.id} for tenant ${tenantId}`);
    await this.syncService.runSync(tenantId);
  }

  @OnQueueCompleted()
  onCompleted(job: Job<PosSyncJobData>): void {
    this.logger.log(`POS sync job ${job.id} completed for tenant ${job.data.tenantId}`);
  }

  @OnQueueFailed()
  onFailed(job: Job<PosSyncJobData>, err: Error): void {
    this.logger.error(
      `POS sync job ${job.id} failed for tenant ${job.data.tenantId}: ${err.message}`,
    );
  }
}
