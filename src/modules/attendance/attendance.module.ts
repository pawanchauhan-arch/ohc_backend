import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Holiday } from 'src/models/holiday.model';
import { Attendance } from '../../models/attendace.model';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { AttendanceCron } from './attendance.cron';
import { User } from 'src/models/User';
import { JwtAdminGuardCenterB2C} from 'src/modules/auth/guards/jwtCenterb2c-auth.guard';
import { AdminOrCenterGuardB2C } from 'src/modules/auth/guards/AdminOrCenterB2cGuard';
import { JwtAdminGuardB2C } from 'src/modules/auth/guards/jwt-b2c-auth.guard';
@Module({
  imports: [SequelizeModule.forFeature([Attendance, Holiday, User])],
  controllers: [AttendanceController],
  providers: [
    JwtAdminGuardCenterB2C,
    AdminOrCenterGuardB2C,
    JwtAdminGuardB2C,
    AttendanceService,
    AttendanceCron
  ], //AttendanceCron
  exports: [AttendanceService],
})
export class AttendanceModule {}
