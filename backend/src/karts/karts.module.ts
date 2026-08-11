import { Module } from '@nestjs/common';
import { KartsService } from './karts.service';
import { KartsController, PublicKartsController } from './karts.controller';

@Module({
  controllers: [KartsController, PublicKartsController],
  providers: [KartsService],
  exports: [KartsService],
})
export class KartsModule {}
