import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AuditLogService } from '../common/audit-log.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [UsersController],
  providers: [UsersService, AuditLogService],
  exports: [UsersService],
})
export class UsersModule {}

