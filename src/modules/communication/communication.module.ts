import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { CommunicationController } from './communication.controller';
import { CommunicationService } from './communication.service';
import { EmailService } from './email.service';
import { EmailRecord } from '../../models/EmailRecord';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { Prescription } from '../../models/Prescription';

@Module({
  imports: [
    SequelizeModule.forFeature([EmailRecord, driverhealthcheckup, Prescription]),
  ],
  controllers: [CommunicationController],
  providers: [CommunicationService, EmailService],
  exports: [CommunicationService, EmailService],
})
export class CommunicationModule {}