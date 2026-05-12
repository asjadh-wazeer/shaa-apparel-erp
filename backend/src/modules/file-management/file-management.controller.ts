import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileManagementService } from './file-management.service';

@ApiTags('File Management')
@ApiBearerAuth()
@Controller({ path: 'file-management', version: '1' })
export class FileManagementController {
  constructor(private readonly filemanagementService: FileManagementService) {}
}
