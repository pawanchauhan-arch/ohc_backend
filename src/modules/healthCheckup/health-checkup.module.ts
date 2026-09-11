import { Module } from '@nestjs/common';
import { InstavansParkflowModule } from '../instavans-parkflow/instavans-parkflow.module';

import { HealthCheckupService } from './health-checkup.service';
import { MobiLabModule } from '../MobiLab/mobilab.module';
import { HealthModule } from '../ViewDriverHealth/health.module';

@Module({
  imports: [InstavansParkflowModule, MobiLabModule, HealthModule],
  providers: [HealthCheckupService],
  exports: [HealthCheckupService],
})
export class HealthCheckupModuleLMC {}
