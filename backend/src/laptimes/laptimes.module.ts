import { Module } from '@nestjs/common';
import { LapTimesController } from './laptimes.controller';
import { LapTimesService } from './laptimes.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LapTimesController],
  providers: [LapTimesService],
  exports: [LapTimesService],
})
export class LapTimesModule {}
