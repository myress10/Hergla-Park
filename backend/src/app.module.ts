import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EspacesModule } from './espaces/espaces.module';
import { Objects3dModule } from './objects3d/objects3d.module';

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
  ],
})
export class AppModule {}
