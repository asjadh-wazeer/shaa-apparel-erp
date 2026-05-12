import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FinishedGoodsService } from './finished-goods.service';
import { CreateFinishedGoodDto } from './dto/create-finished-good.dto';
import { UpdateFinishedGoodDto } from './dto/update-finished-good.dto';
import { QueryFinishedGoodsDto } from './dto/query-finished-goods.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';

@ApiTags('Finished Goods')
@ApiBearerAuth()
@Controller({ path: 'finished-goods', version: '1' })
export class FinishedGoodsController {
  constructor(private readonly service: FinishedGoodsService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  @Get()
  findMany(@Request() req: any, @Query() query: QueryFinishedGoodsDto) {
    return this.service.findMany(req.user.tenantId, query);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateFinishedGoodDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get(':id')
  findById(@Request() req: any, @Param('id') id: string) {
    return this.service.findById(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateFinishedGoodDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.tenantId, id);
  }

  @Post(':id/adjust-stock')
  adjustStock(@Request() req: any, @Param('id') id: string, @Body() dto: AdjustStockDto) {
    return this.service.adjustStock(req.user.tenantId, id, dto);
  }
}
