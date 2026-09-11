import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Attendance } from '../../models/attendace.model';
import { Holiday } from 'src/models/holiday.model';
import { User } from 'src/models/User';
import { Op } from 'sequelize';
import * as ExcelJS from 'exceljs';
import { buildScopeWhere } from 'src/helper/auth.helper';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance)
    private attendanceModel: typeof Attendance,

    @InjectModel(Holiday)
    private holidayModel: typeof Holiday,

    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  private getToday() {
    return new Date().toISOString().split('T')[0];
  }

  async checkIn(requestingUser: any) {
    const today = this.getToday();

    const existing = await this.attendanceModel.findOne({
      where: { user_id: requestingUser.id, attendance_date: today },
    });

    if (existing?.check_in) {
      throw new ConflictException('Already checked in');
    }

    if (existing) {
      existing.check_in = new Date();
      existing.status = 'PRESENT';
      return await existing.save();
    }

    return await this.attendanceModel.create({
      user_id: requestingUser.id,
      attendance_date: today,
      check_in: new Date(),
      status: 'PRESENT',
      source: 'WEB',
      center_id: requestingUser.centerId,
      tenant_id: requestingUser.tenantId,
      added_by: requestingUser.id,
    });
  }

  async checkOut(requestingUser: any) {
    const today = this.getToday();

    const record = await this.attendanceModel.findOne({
      where: { user_id: requestingUser.id, attendance_date: today },
    });

    if (!record || !record.check_in) {
      throw new ConflictException('Check-in required first');
    }

    if (record.check_out) {
      throw new ConflictException('Already checked out');
    }

    record.check_out = new Date();

    const diff =
      (record.check_out.getTime() - record.check_in.getTime()) / 60000;

    record.working_minutes = Math.round(diff);

    return await record.save();
  }

  async getAttendance(requestingUser: any, filters: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.attendanceModel,

    );

    const where: any = {
      ...scopeWhere,
    };
    
    const hasAdvancedFilters = filters.date || filters.user || filters.status;

    // 🔥 Case 1: Advanced filters (ignore month/year)
    if (hasAdvancedFilters) {
      if (filters.date) {
        where.attendance_date = filters.date;
      }

      if (filters.user) {
        where.user_id = filters.user;
      }

      if (filters.status) {
        where.status = filters.status;
      }
    }

    // 🔥 Case 2: Only month/year filter
    else if (filters.month && filters.year) {
      const startDate = new Date(filters.year, filters.month - 1, 1);
      const endDate = new Date(filters.year, filters.month, 0);

      where.attendance_date = {
        [Op.between]: [startDate, endDate],
      };
    }

    return await this.attendanceModel.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['name', 'phone'],
        },
      ],
      order: [['attendance_date', 'DESC']],
    });
    
  }

  async getMonthlyStats(requestingUser: any, month: number, year: number, userId?:number) {
    const jsMonth = month - 1;

    const start = new Date(year, jsMonth, 1);
    const end = new Date(year, jsMonth + 1, 0);

    const startStr = start.toLocaleDateString('en-CA');
    const endStr = end.toLocaleDateString('en-CA');
    const targetUserId = userId || requestingUser.id;

    const records = await this.attendanceModel.findAll({
      where: {
        user_id: targetUserId ,
        attendance_date: {
          [Op.between]: [startStr, endStr],
        },
      },
    });

    const holidays = await this.holidayModel.findAll({
      where: {
        holiday_date: {
          [Op.between]: [startStr, endStr],
        },
      },
    });

    const holidaySet = new Set(holidays.map((h) => h.holiday_date));

    let workingDays = 0;

    for (let d = 1; d <= end.getDate(); d++) {
      // const date = new Date(year, jsMonth, d);
      const date = new Date(year, month - 1, d);

      // ✅ FIX timezone issue
      const dateStr = date.toLocaleDateString('en-CA'); // YYYY-MM-DD

      const isSunday = date.getDay() === 0;
      const isHoliday = holidaySet.has(dateStr);

      if (!isSunday && !isHoliday && date <= new Date()) {
        workingDays++;
      }
    }

    const present = records.filter((r) => r.status === 'PRESENT').length;

    const absent = Math.max(0, workingDays - present);

    const percent =
      workingDays === 0 ? 0 : Math.round((present / workingDays) * 100);

    return {
      workingDays,
      present,
      absent,
      percent,
    };
  }

  async getAdminDashboard(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.attendanceModel,
    );
    const where: any = {
      ...scopeWhere,
    };
    const today = new Date().toISOString().split('T')[0];

    const totalStaff = await this.userModel.count({
      where: {
        ...where,
      },
    });

    const presentToday = await this.attendanceModel.count({
      where: {
        ...where,
        attendance_date: today,
        status: 'PRESENT',
      },
    });

    const absentToday = Math.max(0, totalStaff - presentToday);

    const score =
      totalStaff === 0 ? 0 : Math.round((presentToday / totalStaff) * 100);

    return {
      totalStaff,
      presentToday,
      absentToday,
      score,
    };
  }
  async getCalendarData(requestingUser: any, month: number, year: number,userId:number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0);

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];
    const targetUserId = userId || requestingUser.id;


    // 1. Attendance records
    const records = await this.attendanceModel.findAll({
      where: {
        user_id: targetUserId ,
        attendance_date: {
          [Op.between]: [startStr, endStr],
        },
      },
    });

    // 2. Holidays
    const holidays = await this.holidayModel.findAll({
      where: {
        holiday_date: {
          [Op.between]: [startStr, endStr],
        },
      },
    });

    const holidaySet = new Set(holidays.map((h) => h.holiday_date));

    // 3. Convert attendance to map
    const attendanceMap = new Map(
      records.map((r) => [r.attendance_date, r.status]),
    );

    // 4. Build full month response
    const result = [];

    for (let d = 1; d <= end.getDate(); d++) {
      const date = new Date(year, month - 1, d);
      const dateStr = date.toLocaleDateString('en-CA');

      const isSunday = date.getDay() === 0;
      const isHoliday = holidaySet.has(dateStr);

      if (isHoliday) {
        result.push({ date: dateStr, status: 'HOLIDAY' });
        continue;
      }

      if (isSunday) {
        result.push({ date: dateStr, status: 'WEEK_OFF' });
        continue;
      }

      const status = attendanceMap.get(dateStr);

      if (status) {
        result.push({ date: dateStr, status });
      } else if (date <= new Date()) {
        result.push({ date: dateStr, status: 'ABSENT' });
      } else {
        result.push({ date: dateStr, status: 'FUTURE' });
      }
    }

    return result;
  }
  async exportAttendance(requestingUser: any, filters: any, res: any) {
    const records = await this.getAttendance(requestingUser, filters);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Attendance');

    // 🧠 Month helper
    const getMonthName = (month: number) =>
      new Date(0, month - 1).toLocaleString('en-IN', { month: 'long' });

    // ✅ TITLE
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'Attendance Report';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // ✅ FILTER INFO
    let rowIndex = 2;

    if (filters.date) {
      worksheet.getCell(`A${rowIndex++}`).value = `Date: ${filters.date}`;
    } else if (filters.month && filters.year) {
      worksheet.getCell(`A${rowIndex++}`).value =
        `Month: ${getMonthName(filters.month)} ${filters.year}`;
    }

    if (filters.status) {
      worksheet.getCell(`A${rowIndex++}`).value = `Status: ${filters.status}`;
    }

    if (filters.user) {
      const name = records[0]?.user?.name || filters.user;
      worksheet.getCell(`A${rowIndex++}`).value = `User: ${name}`;
    }

    rowIndex++; // empty row

    // ✅ MANUAL HEADER (IMPORTANT FIX)
    const headerRow = worksheet.getRow(rowIndex);

    headerRow.values = [
      'Employee Name',
      'Mobile',
      'Date',
      'Check In',
      'Check Out',
      'Working Hours',
      'Status',
    ];

    headerRow.font = { bold: true };

    // optional styling
    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        bottom: { style: 'thin' },
      };
    });

    rowIndex++;

    // 🧠 Format helpers
    const formatDateTime = (value: Date | null) => {
      if (!value) return '-';
      const d = new Date(value);
      if (isNaN(d.getTime())) return '-';

      return d.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    };

    const formatMinutes = (minutes: number | null) => {
      if (minutes == null) return '-';
      const hrs = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hrs}h ${mins}m`;
    };

    // ✅ DATA ROWS
    records.forEach((r: any) => {
      worksheet.addRow([
        r?.user?.name || '-',
        r?.user?.phone || '-',
        r.attendance_date,
        formatDateTime(r.check_in),
        formatDateTime(r.check_out),
        formatMinutes(r.working_minutes),
        r.status,
      ]);
    });

    // ✅ Column widths (after data)
    worksheet.columns = [
      { width: 25 },
      { width: 20 },
      { width: 15 },
      { width: 25 },
      { width: 25 },
      { width: 20 },
      { width: 15 },
    ];

    // ✅ Freeze header
    worksheet.views = [{ state: 'frozen', ySplit: rowIndex }];

    // 🎯 RESPONSE
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=attendance_${Date.now()}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async getUsers(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.userModel,
    );

    const where: any = {
      ...scopeWhere,
    };

    const totalStaff = await this.userModel.findAll({
      where: {
        ...where,
      },
      attributes: ['id', 'name','username'],
    });
    return {
      data: totalStaff,
    };
  }
}
