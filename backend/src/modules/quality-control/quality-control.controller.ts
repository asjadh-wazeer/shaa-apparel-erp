import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { QualityControlService } from './quality-control.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { UpdateQualityCheckDto } from './dto/update-quality-check.dto';
import { QueryQualityChecksDto } from './dto/query-quality-checks.dto';
import { AddReworkDto, UpdateReworkDto } from './dto/add-rework.dto';

@ApiTags('Quality Control')
@ApiBearerAuth()
@Controller({ path: 'quality-control', version: '1' })
export class QualityControlController {
  constructor(private readonly service: QualityControlService) {}

  @Get('stats')
  getStats(@Request() req: any) {
    return this.service.getStats(req.user.tenantId);
  }

  @Get()
  findMany(@Request() req: any, @Query() query: QueryQualityChecksDto) {
    return this.service.findMany(req.user.tenantId, query);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateQualityCheckDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get(':id')
  findById(@Request() req: any, @Param('id') id: string) {
    return this.service.findById(req.user.tenantId, id);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateQualityCheckDto) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Post(':id/approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.service.approve(req.user.tenantId, id, req.user.sub);
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id') id: string) {
    return this.service.delete(req.user.tenantId, id);
  }

  @Post(':id/reworks')
  addRework(@Request() req: any, @Param('id') id: string, @Body() dto: AddReworkDto) {
    return this.service.addRework(req.user.tenantId, id, dto);
  }

  @Patch(':id/reworks/:reworkId')
  updateRework(
    @Request() req: any,
    @Param('id') id: string,
    @Param('reworkId') reworkId: string,
    @Body() dto: UpdateReworkDto,
  ) {
    return this.service.updateRework(req.user.tenantId, id, reworkId, dto);
  }
}
