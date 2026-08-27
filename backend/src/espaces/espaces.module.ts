import { Module } from '@nestjs/common';
import { EspacesService } from './espaces.service';
import { EspacesController } from './espaces.controller';
import { AuditLogService } from '../common/audit-log.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [EspacesController],
  providers: [EspacesService, AuditLogService],
  exports: [EspacesService],
})
export class EspacesModule {}
