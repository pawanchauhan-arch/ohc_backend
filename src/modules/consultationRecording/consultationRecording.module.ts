import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConsultationRecordingService } from './consultationRecording.service';
import { ConsultationRecordingController } from './consultationRecording.controller';
import { Consultation } from 'src/models/Consultation';
import { ConsultationRecording } from 'src/models/consultationRecording';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [SequelizeModule.forFeature([ConsultationRecording, Consultation]),
  NotificationsModule
],
  providers: [ConsultationRecordingService],
  controllers: [ConsultationRecordingController],
  exports: [ConsultationRecordingService],
})
export class ConsultationRecordingModule {}
