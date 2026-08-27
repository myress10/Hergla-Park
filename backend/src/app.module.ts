import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EspacesModule } from './espaces/espaces.module';
import { Objects3dModule } from './objects3d/objects3d.module';
import { CompaniesModule } from './companies/companies.module';
import { RolesModule } from './roles/roles.module';
import { RootModule } from './root/root.module';
import { KartsModule } from './karts/karts.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    EspacesModule,
    Objects3dModule,
    CompaniesModule,
    RolesModule,
    RootModule,
    KartsModule,
    AuditLogsModule,
    SubscriptionsModule,
  ],
})
export class AppModule {}


