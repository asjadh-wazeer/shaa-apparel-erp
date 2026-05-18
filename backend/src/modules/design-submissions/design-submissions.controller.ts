import { Controller, Get, Post, Body, Param, Query, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DesignSubmissionsService } from './design-submissions.service';
import { CreateDesignSubmissionDto } from './dto/create-design-submission.dto';
import { QueryDesignSubmissionsDto } from './dto/query-design-submissions.dto';
import { RejectDesignSubmissionDto } from './dto/reject-design-submission.dto';

@ApiTags('Design Submissions')
@ApiBearerAuth()
@Controller({ path: 'design-submissions', version: '1' })
export class DesignSubmissionsController {
  constructor(private readonly service: DesignSubmissionsService) {}

  @Get()
  findAll(@Request() req: any, @Query() query: QueryDesignSubmissionsDto) {
    return this.service.findAll(req.user.tenantId, query);
  }

  @Post()
  create(@Request() req: any, @Body() dto: CreateDesignSubmissionDto) {
    return this.service.create(req.user.tenantId, dto, req.user.sub);
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Post(':id/approve')
  approve(@Request() req: any, @Param('id') id: string) {
    return this.service.approve(id, req.user.tenantId, req.user.sub);
  }

  @Post(':id/reject')
  reject(@Request() req: any, @Param('id') id: string, @Body() dto: RejectDesignSubmissionDto) {
    return this.service.reject(id, req.user.tenantId, dto);
  }
}
