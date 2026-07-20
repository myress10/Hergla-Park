import { Module } from '@nestjs/common';
import { Objects3dController } from './objects3d.controller';
import { Objects3dService } from './objects3d.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageService } from '../common/storage.service';
import { AuditLogService } from '../common/audit-log.service';

@Module({
  imports: [PrismaModule],
  controllers: [Objects3dController],
  providers: [Objects3dService, StorageService, AuditLogService],
  exports: [Objects3dService],
})
export class Objects3dModule {}

