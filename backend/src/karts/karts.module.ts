import { Module } from '@nestjs/common';
import { KartsService } from './karts.service';
import { KartsController, PublicKartsController } from './karts.controller';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  controllers: [KartsController, PublicKartsController],
  providers: [KartsService],
  exports: [KartsService],
})
export class KartsModule {}
