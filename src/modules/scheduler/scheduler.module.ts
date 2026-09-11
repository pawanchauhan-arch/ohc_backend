import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { ConfigService } from './config.service';
import { PrescriptionModule } from '../Prescription/Prescription.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 10000, // Increased timeout for potentially longer operations
      maxRedirects: 5,
    }),
    PrescriptionModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, ConfigService],
  exports: [SchedulerService],
})
export class SchedulerModule {} 