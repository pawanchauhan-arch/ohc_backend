import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Consultation } from '../../models/Consultation';
import { ConsultationController } from './Consultation.controller';
import { ConsultationService } from './Consultation.service';
import { Request } from '../../models/Request';
import { Doctor } from 'src/models/Doctor';
import { Center } from 'src/models/Center';
import { Prescription } from 'src/models/Prescription';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { CenterGroup } from 'src/models/CenterGroup';
import { NotificationsModule } from '../notifications/notifications.module';
import { ConsultationRecordingModule } from '../consultationRecording/consultationRecording.module';
import { DailyVideoModule } from '../dailyVideoCall/dailyVideo.module';

@Module({
  imports: [
    SequelizeModule.forFeature([Consultation, Request, Doctor, Center, Prescription, DRIVERMASTER, CenterGroup]),
    NotificationsModule,
    ConsultationRecordingModule,
    DailyVideoModule
  ],
  controllers: [ConsultationController],
  providers: [ConsultationService],
  exports: [ConsultationService],
})
export class ConsultationModule {}
