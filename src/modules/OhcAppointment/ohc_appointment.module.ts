import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { OHCAppointment } from '../../models/OhcAppointment.model';
import { OhcAppointmentService } from './ohc_appointment.service';
import { OhcAppointmentController } from './ohc_appointment.controller';

@Module({
  imports: [SequelizeModule.forFeature([OHCAppointment])],
  providers: [OhcAppointmentService],
  controllers: [OhcAppointmentController],
  exports: [OhcAppointmentService],
})
export class OhcAppointmentModule {}