import {
  Controller, Get, Param, Res, NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import * as fs from 'fs';
import { Public } from '../../common/decorators';
import { FileManagementService } from './file-management.service';

@ApiTags('File Management')
@ApiBearerAuth()
@Controller({ path: 'file-management', version: '1' })
export class FileManagementController {
  constructor(private readonly filemanagementService: FileManagementService) {}

  @Public()
  @Get('serve/:filename')
  serveFile(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = this.filemanagementService.getFilePath(filename);
    if (!fs.existsSync(filePath)) throw new NotFoundException('File not found');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.sendFile(filePath);
  }
}
