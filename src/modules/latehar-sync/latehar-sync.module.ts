import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { LateharSyncController } from './latehar-sync.controller';
import { GovPatientPushService } from './latehar-sync.service';
import { LateharSyncCron } from './latehar-sync.cron';

@Module({
    imports: [ScheduleModule.forRoot()],
    controllers: [LateharSyncController],
    providers: [GovPatientPushService, LateharSyncCron],
})
export class LateharSyncModule { }
