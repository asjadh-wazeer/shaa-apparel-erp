import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import * as path from 'path';
import * as fs from 'fs';

export const UPLOAD_DIR = process.env.UPLOAD_DIR ?? path.join(process.cwd(), 'uploads');

@Injectable()
export class FileManagementService {
  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
  }

  async saveFileRecord(params: {
    tenantId: string;
    uploadedById: string;
    entityType: string;
    entityId: string;
    originalName: string;
    storedName: string;
    mimeType: string;
    sizeBytes: number;
  }) {
    return this.prisma.fileUpload.create({
      data: {
        tenantId:    params.tenantId,
        uploadedById: params.uploadedById,
        entityType:  params.entityType as any,
        entityId:    params.entityId,
        originalName: params.originalName,
        storedName:  params.storedName,
        mimeType:    params.mimeType,
        sizeBytes:   params.sizeBytes,
        storagePath: path.join(UPLOAD_DIR, params.storedName),
        bucketName:  'local',
        isPublic:    true,
      },
    });
  }

  async getFilesForEntity(entityId: string) {
    return this.prisma.fileUpload.findMany({
      where: { entityId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
  }

  getFilePath(storedName: string): string {
    return path.join(UPLOAD_DIR, storedName);
  }
}
