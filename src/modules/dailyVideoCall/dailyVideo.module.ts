import { Module } from '@nestjs/common';
import { DailyVideoController } from './dailyVideo.controller';
import { DailyVideoService } from './dailyVideo.service';
import { Consultation } from 'src/models/Consultation';
import { ConsultationRecording } from 'src/models/consultationRecording';
import { SequelizeModule } from '@nestjs/sequelize';
import { NotificationsModule } from '../notifications/notifications.module';
import { HttpModule } from '@nestjs/axios';

@Module({
    imports: [SequelizeModule.forFeature([ConsultationRecording, Consultation]),
    NotificationsModule,
    HttpModule,
],
    controllers: [DailyVideoController],
    providers: [DailyVideoService],
    exports: [DailyVideoService],
})
export class DailyVideoModule {}
