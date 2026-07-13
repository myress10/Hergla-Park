import { Module } from '@nestjs/common';
import { EspacesService } from './espaces.service';
import { EspacesController } from './espaces.controller';

@Module({
  controllers: [EspacesController],
  providers: [EspacesService],
  exports: [EspacesService],
})
export class EspacesModule {}
