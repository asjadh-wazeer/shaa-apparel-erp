import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { PrismaService } from '../../database/prisma.service';

export interface SyncPayloadItem {
  sku: string;
  name: string;
  category: string | null;
  color: string | null;
  size: string | null;
  stock: number;
  price: number;
  posItemId: string | null;
}

@Injectable()
export class PosSyncService {
  private readonly logger = new Logger(PosSyncService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Main sync entry point. Called by the BullMQ processor.
   * Reads PosConfig, builds the catalog payload, pushes to the external endpoint,
   * and writes a PosSyncLog entry with the result.
   */
  async runSync(tenantId: string): Promise<void> {
    const config = await this.prisma.posConfig.findUnique({ where: { tenantId } });

    if (!config || !config.isActive || !config.apiEndpoint) {
      this.logger.warn(`[${tenantId}] Sync skipped — no active config or endpoint`);
      return;
    }

    const logEntry = await this.prisma.posSyncLog.create({
      data: {
        tenantId,
        posConfigId: config.id,
        syncType: 'INVENTORY_PUSH',
        status: 'PENDING',
        startedAt: new Date(),
      },
    });

    try {
      const items = await this.buildCatalogPayload(tenantId);
      const { synced, failed, errors } = await this.pushToEndpoint(
        config.apiEndpoint,
        config.apiKeyHash ?? '',
        items,
      );

      await this.prisma.$transaction([
        this.prisma.posSyncLog.update({
          where: { id: logEntry.id },
          data: {
            status: failed === 0 ? 'SUCCESS' : 'FAILED',
            itemsSynced: synced,
            itemsFailed: failed,
            errorLog: errors.length ? errors : undefined,
            completedAt: new Date(),
          },
        }),
        this.prisma.posConfig.update({
          where: { tenantId },
          data: { lastSyncAt: new Date() },
        }),
        // Mark each synced finished good with lastSyncedAt
        ...items.map((item) =>
          this.prisma.finishedGood.updateMany({
            where: { tenantId, sku: item.sku },
            data: { lastSyncedAt: new Date() },
          }),
        ),
      ]);

      this.logger.log(`[${tenantId}] Sync complete — synced: ${synced}, failed: ${failed}`);
    } catch (err: any) {
      await this.prisma.posSyncLog.update({
        where: { id: logEntry.id },
        data: {
          status: 'FAILED',
          itemsFailed: 0,
          errorLog: [{ message: err?.message ?? 'Unknown error' }],
          completedAt: new Date(),
        },
      });
      this.logger.error(`[${tenantId}] Sync failed — ${err?.message}`);
      throw err;
    }
  }

  /**
   * Returns the public catalog payload for external consumers (pull-based sync).
   */
  async getPublicCatalog(tenantId: string): Promise<SyncPayloadItem[]> {
    return this.buildCatalogPayload(tenantId);
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async buildCatalogPayload(tenantId: string): Promise<SyncPayloadItem[]> {
    const goods = await this.prisma.finishedGood.findMany({
      where: { tenantId, isActive: true },
      orderBy: { name: 'asc' },
    });

    return goods.map((g) => ({
      sku: g.sku,
      name: g.name,
      category: g.category,
      color: g.color,
      size: g.size,
      stock: g.quantity,
      price: Number(g.sellingPrice),
      posItemId: g.posItemId,
    }));
  }

  /**
   * Sends inventory payload to the configured external endpoint.
   * Supports three formats:
   *  - WooCommerce REST API  (endpoint contains /wp-json/wc/)
   *  - Generic webhook       (any other URL)
   * Returns counts of synced / failed items with per-item error details.
   */
  private async pushToEndpoint(
    endpoint: string,
    apiKey: string,
    items: SyncPayloadItem[],
  ): Promise<{ synced: number; failed: number; errors: any[] }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(apiKey && { Authorization: `Bearer ${apiKey}` }),
    };

    const isWooCommerce = endpoint.includes('/wp-json/wc/');

    if (isWooCommerce) {
      return this.pushWooCommerce(endpoint, apiKey, items);
    }

    // Generic webhook — send entire payload in one request
    try {
      await axios.post(
        endpoint,
        { event: 'inventory.sync', timestamp: new Date().toISOString(), items },
        { headers, timeout: 30_000 },
      );
      return { synced: items.length, failed: 0, errors: [] };
    } catch (err) {
      const axiosErr = err as AxiosError;
      const message = axiosErr.response
        ? `HTTP ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`
        : axiosErr.message;
      return { synced: 0, failed: items.length, errors: [{ message }] };
    }
  }

  /**
   * WooCommerce batch update — PATCH /products/batch using Basic Auth
   * (consumer_key:consumer_secret encoded as base64).
   */
  private async pushWooCommerce(
    endpoint: string,
    credentials: string,
    items: SyncPayloadItem[],
  ): Promise<{ synced: number; failed: number; errors: any[] }> {
    const base = endpoint.replace(/\/$/, '');
    const authHeader = `Basic ${Buffer.from(credentials).toString('base64')}`;
    const errors: any[] = [];
    let synced = 0;
    let failed = 0;

    // WooCommerce batch update supports up to 100 items per request
    const batches: SyncPayloadItem[][] = [];
    for (let i = 0; i < items.length; i += 100) {
      batches.push(items.slice(i, i + 100));
    }

    for (const batch of batches) {
      const updatePayload = batch.map((item) => ({
        ...(item.posItemId ? { id: Number(item.posItemId) } : { sku: item.sku }),
        stock_quantity: item.stock,
        manage_stock: true,
        regular_price: String(item.price),
      }));

      try {
        const res = await axios.post<{ update: any[]; create: any[] }>(
          `${base}/products/batch`,
          { update: updatePayload },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            timeout: 60_000,
          },
        );
        synced += (res.data.update ?? []).length;
      } catch (err) {
        const axiosErr = err as AxiosError;
        const message = axiosErr.response
          ? `HTTP ${axiosErr.response.status}: ${JSON.stringify(axiosErr.response.data)}`
          : axiosErr.message;
        failed += batch.length;
        errors.push({ message, batch: batch.map((i) => i.sku) });
      }
    }

    return { synced, failed, errors };
  }
}
