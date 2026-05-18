import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomBytes } from 'crypto';
import { FileManagementController } from './file-management.controller';
import { FileManagementService, UPLOAD_DIR } from './file-management.service';
import { PrismaModule } from '../../database/prisma.module';

export const multerOptions = {
  storage: diskStorage({
    destination: (_req: any, _file: any, cb: any) => cb(null, UPLOAD_DIR),
    filename: (_req: any, file: any, cb: any) => {
      const unique = randomBytes(8).toString('hex');
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowed = /jpeg|jpg|png|gif|webp|pdf/;
    cb(null, allowed.test(extname(file.originalname).toLowerCase()) || allowed.test(file.mimetype));
  },
};

@Module({
  imports: [PrismaModule, MulterModule.register(multerOptions)],
  controllers: [FileManagementController],
  providers: [FileManagementService],
  exports: [FileManagementService, MulterModule],
})
export class FileManagementModule {}
