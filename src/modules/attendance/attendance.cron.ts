import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/sequelize';
import { Attendance } from '../../models/attendace.model';
import { User } from '../../models/User';
import { Holiday } from '../../models//holiday.model';

@Injectable()
export class AttendanceCron {
  constructor(
    @InjectModel(Attendance)
    private attendanceModel: typeof Attendance,

    @InjectModel(User)
    private userModel: typeof User,

    @InjectModel(Holiday)
    private holidayModel: typeof Holiday
  ) {}

  // Runs every day at 12:10 AM
  @Cron('10 0 * * *')
  
  async markAbsent() {
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const dateStr = yesterday.toISOString().split('T')[0];

    // ❌ Skip Sunday
    if (yesterday.getDay() === 0) return;

    // ❌ Skip Holiday
    const isHoliday = await this.holidayModel.findOne({
      where: { holiday_date: dateStr },
    });

    if (isHoliday) return;

    // Get all active users
    const users = await this.userModel.findAll({
      attributes: ['id'],
    });

    for (const user of users) {
      const existing = await this.attendanceModel.findOne({
        where: {
          user_id: user.id,
          attendance_date: dateStr,
        },
      });

      if (!existing) {
        await this.attendanceModel.create({
          user_id: user.id,
          attendance_date: dateStr,
          status: 'ABSENT',
          source: 'WEB',
        });
      }
    }
  }
}