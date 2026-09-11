import {
  Controller,
  Post,
  Get,
  Query,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { FilterAttendanceDto } from './dto/filter-attendance.dto';
import { Response, Request } from 'express';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('check-in')
  checkIn(@Req() req: Request) {
    return this.attendanceService.checkIn(req['user']);
  }

  @Post('check-out')
  checkOut(@Req() req: Request) {
    return this.attendanceService.checkOut(req['user']);
  }

  @Get()
  getAttendance(@Req() req: Request, @Query() query: FilterAttendanceDto) {
    return this.attendanceService.getAttendance(req['user'], query);
  }

 
  @Get('stats')
getStats(@Req() req: Request, @Query() query) {
  return this.attendanceService.getMonthlyStats(
    req['user'],
    Number(query.month),
    Number(query.year),
    Number(query.userId),
  );
}
  @Get('admin/dashboard')
  getDashboard(@Req() req: Request) {
    return this.attendanceService.getAdminDashboard(req['user']);
  }

  @Get('calendar')
  getCalendar(
    @Req() req: Request,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('userId') userId?: number,
  ) {
    return this.attendanceService.getCalendarData(
      req['user'],
      Number(month),
      Number(year),
      Number(userId || 0),
    );
  }

  @Get('export')
  async exportAttendance(
    @Req() req: Request,
    @Query() query: any,
    @Res() res: any,
  ) {
    return this.attendanceService.exportAttendance(req['user'], query, res);
  }
  @Get('users')
  getUsers(@Req() req: Request) {
    return this.attendanceService.getUsers(req['user']);
  }
}
