import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { QUEUE_NAMES } from '../../common/constants';
import { PosIntegrationRepository } from './pos-integration.repository';
import { PosSyncService } from './pos-sync.service';
import { POS_SYNC_JOB } from './pos-sync.processor';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { UpsertPosConfigDto } from './dto/upsert-pos-config.dto';

@Injectable()
export class PosIntegrationService {
  constructor(
    private readonly repo: PosIntegrationRepository,
    private readonly syncService: PosSyncService,
    @InjectQueue(QUEUE_NAMES.POS_SYNC) private readonly syncQueue: Queue,
  ) {}

  // ── Sales ──────────────────────────────────────────────────────────────────

  async getSalesStats(tenantId: string) {
    return this.repo.getSalesStats(tenantId);
  }

  async findManySales(tenantId: string, query: QuerySalesDto) {
    const page = Math.max(1, parseInt(query.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '20', 10)));
    const { data, total } = await this.repo.findManySales(tenantId, {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      channel: query.channel,
      status: query.status,
      search: query.search,
      page,
      limit,
    });
    return {
      success: true,
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findSaleById(tenantId: string, id: string) {
    const sale = await this.repo.findSaleById(tenantId, id);
    if (!sale) throw new NotFoundException(`Sale ${id} not found`);
    return sale;
  }

  async createSale(tenantId: string, dto: CreateSaleDto) {
    try {
      const saleNumber = await this.repo.nextSaleNumber(tenantId);
      const sale = await this.repo.createSale(tenantId, saleNumber, dto);
      // Queue a sync after a sale so website stock reflects the deduction
      await this.enqueueSyncIfActive(tenantId);
      return sale;
    } catch (err: any) {
      if (err.message?.includes('Insufficient stock') || err.message?.includes('not found')) {
        throw new BadRequestException(err.message);
      }
      throw err;
    }
  }

  async updateSale(tenantId: string, id: string, dto: UpdateSaleDto) {
    await this.findSaleById(tenantId, id);
    return this.repo.updateSale(tenantId, id, dto);
  }

  async deleteSale(tenantId: string, id: string) {
    await this.findSaleById(tenantId, id);
    return this.repo.deleteSale(tenantId, id);
  }

  // ── POS Config ─────────────────────────────────────────────────────────────

  async getPosConfig(tenantId: string) {
    return this.repo.getPosConfig(tenantId);
  }

  async upsertPosConfig(tenantId: string, dto: UpsertPosConfigDto) {
    return this.repo.upsertPosConfig(tenantId, dto);
  }

  // ── Catalog ────────────────────────────────────────────────────────────────

  async getCatalog(tenantId: string) {
    return this.repo.getCatalog(tenantId);
  }

  // ── Sync ───────────────────────────────────────────────────────────────────

  /**
   * Manually enqueue a sync job. Returns immediately — the worker runs async.
   */
  async triggerSync(tenantId: string): Promise<{ jobId: string | number }> {
    const config = await this.repo.getPosConfig(tenantId);
    if (!config) throw new BadRequestException('POS configuration not found. Please configure it first.');
    if (!config.apiEndpoint) throw new BadRequestException('API endpoint not configured. Add it in POS settings.');

    const job = await this.syncQueue.add(
      POS_SYNC_JOB,
      { tenantId },
      { removeOnComplete: true, removeOnFail: false },
    );
    return { jobId: job.id };
  }

  async getSyncLogs(tenantId: string) {
    return this.repo.getSyncLogs(tenantId, 50);
  }

  async getSyncStatus(tenantId: string) {
    const [config, lastLog] = await Promise.all([
      this.repo.getPosConfig(tenantId),
      this.repo.getLastSyncLog(tenantId),
    ]);
    return { config, lastLog };
  }

  /**
   * Returns the full catalog payload for the external website to pull (no auth needed
   * on the consumer side — the URL itself is the secret until we add an API key check).
   */
  async getPublicCatalog(tenantId: string) {
    return this.syncService.getPublicCatalog(tenantId);
  }

  /**
   * Called by FinishedGoodsService after any stock change so the website stays in sync.
   */
  async enqueueSyncIfActive(tenantId: string): Promise<void> {
    const config = await this.repo.getPosConfig(tenantId);
    if (!config?.isActive || !config.apiEndpoint) return;
    await this.syncQueue.add(
      POS_SYNC_JOB,
      { tenantId },
      { delay: 2000, removeOnComplete: true },
    );
  }
}
