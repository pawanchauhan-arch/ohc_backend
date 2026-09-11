import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Doctor } from '../../models/Doctor';
import { User } from '../../models/User';
import { DoctorController } from './Doctor.controller';
import { DoctorService } from './Doctor.service';
import { Consultation } from 'src/models/Consultation';

@Module({
  imports: [
    SequelizeModule.forFeature([Doctor, User, Consultation]), // Register Doctor and User models
  ],
  controllers: [DoctorController], // Register Doctor controller
  providers: [DoctorService], // Register Doctor service
})
export class DoctorModule {}