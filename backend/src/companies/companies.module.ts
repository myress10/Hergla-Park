import { Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { EspacesModule } from '../espaces/espaces.module';

@Module({
  imports: [EspacesModule],          // EspacesService is exported from EspacesModule
  controllers: [CompaniesController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
