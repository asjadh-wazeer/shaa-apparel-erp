import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../../common/decorators';
import { PosIntegrationService } from './pos-integration.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySalesDto } from './dto/query-sales.dto';
import { UpsertPosConfigDto } from './dto/upsert-pos-config.dto';

@ApiTags('POS Integration')
@ApiBearerAuth()
@Controller({ path: 'pos-integration', version: '1' })
export class PosIntegrationController {
  constructor(private readonly service: PosIntegrationService) {}

  // ── Sales stats & catalog ──────────────────────────────────────────────────

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getSalesStats(req.user.tenantId);
  }

  @Get('catalog')
  getCatalog(@Request() req: any) {
    return this.service.getCatalog(req.user.tenantId);
  }

  // ── POS config ─────────────────────────────────────────────────────────────

  @Get('config')
  getConfig(@Request() req: any) {
    return this.service.getPosConfig(req.user.tenantId);
  }

  @Post('config')
  upsertConfig(@Request() req: any, @Body() dto: UpsertPosConfigDto) {
    return this.service.upsertPosConfig(req.user.tenantId, dto);
  }

  // ── Sales CRUD ─────────────────────────────────────────────────────────────

  @Get('sales')
  findMany(@Request() req: any, @Query() query: QuerySalesDto) {
    return this.service.findManySales(req.user.tenantId, query);
  }

  @Post('sales')
  create(@Request() req: any, @Body() dto: CreateSaleDto) {
    return this.service.createSale(req.user.tenantId, dto);
  }

  @Get('sales/:id')
  findById(@Request() req: any, @Param('id') id: string) {
    return this.service.findSaleById(req.user.tenantId, id);
  }

  @Patch('sales/:id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateSaleDto) {
    return this.service.updateSale(req.user.tenantId, id, dto);
  }

  @Delete('sales/:id')
  delete(@Request() req: any, @Param('id') id: string) {
    return this.service.deleteSale(req.user.tenantId, id);
  }

  // ── Website Sync ───────────────────────────────────────────────────────────

  /** Manually trigger an inventory push to the external website */
  @Post('sync/trigger')
  triggerSync(@Request() req: any) {
    return this.service.triggerSync(req.user.tenantId);
  }

  /** Get the last N sync logs */
  @Get('sync/logs')
  getSyncLogs(@Request() req: any) {
    return this.service.getSyncLogs(req.user.tenantId);
  }

  /** Get current sync config + last log in one call */
  @Get('sync/status')
  getSyncStatus(@Request() req: any) {
    return this.service.getSyncStatus(req.user.tenantId);
  }

  /**
   * Public pull endpoint — the external website calls this to fetch the latest
   * inventory. No auth required; the tenantId in the URL acts as the access key.
   * Example: GET /api/v1/pos-integration/public/catalog/<tenantId>
   */
  @Public()
  @Get('public/catalog/:tenantId')
  getPublicCatalog(@Param('tenantId') tenantId: string) {
    return this.service.getPublicCatalog(tenantId);
  }
}
