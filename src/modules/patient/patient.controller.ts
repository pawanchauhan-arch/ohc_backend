import {
  Controller,
  Get,
  Query,
  Body,
  BadRequestException,
  Post,
  Put,
  Param,
  UseGuards,
  Req,
  Delete,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { Request } from 'express';
import { GlobalHelper } from 'src/helper/global.helper';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/patient')
export class PatientController {
  constructor(private readonly patientService: PatientService) {}

  @Get()
  async getPatients(
    @Req() req: Request,
    @Query() filters,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.patientService.getPatientsRaw(
      req['user'],
      filters,
      Number(page),
      Number(limit),
    );
  }

  @Post('register')
  async registerPatient(
    @Req() req: Request,
    @Body() patientData: Partial<DRIVERMASTER>,
  ): Promise<{ message: string; driver?: DRIVERMASTER }> {
    if (
      !patientData.name ||
      !patientData.contactNumber ||
      !patientData.gender
    ) {
      throw new BadRequestException(
        'Name, Contact Number, and Gender are required.',
      );
    }
    return this.patientService.registerPatient(req['user'], patientData);
  }

  // no need for this filter logic start

  @Get('by-mobile')
  async getPatientByMobile(
    @Query('phoneNumber') phoneNumber: string,
  ): Promise<DRIVERMASTER[]> {
    return this.patientService.findByMobile(phoneNumber);
  }

  @Get('by-id')
  async getPatientById(
    @Query('patientId') patientId: number,
  ): Promise<DRIVERMASTER> {
    return this.patientService.findById(patientId);
  }

  @Get('by-unique-id') // Aadhaar / License lookup
  async getPatientByUniqueId(
    @Query('uniqueId') uniqueId: string,
  ): Promise<DRIVERMASTER> {
    return this.patientService.findByUniqueId(uniqueId);
  }

  @Get('by-created-date')
  async getPatientsByCreatedDate(
    @Query('date') date?: string,
    @Query('start') start?: string,
    @Query('end') end?: string,
  ): Promise<DRIVERMASTER[]> {
    return this.patientService.findByCreatedDate({ date, start, end });
  }

  @Put('update-patient/:id')
  async updatePatient(
    @Param('id') patientId: number,
    @Body() updateData: Partial<DRIVERMASTER>,
  ): Promise<{ message: string; driver?: DRIVERMASTER }> {
    return this.patientService.updatePatient(patientId, updateData);
  }
  // Filer logic ends

  @Get('by-uhid')
  async getPatientByUHID(
    @Req() req: Request,
    @Query('uhid') uhid: string,
  ): Promise<DRIVERMASTER> {
    if (!uhid || uhid.trim() === '') {
      throw new BadRequestException('UHID query parameter is required');
    }

    return this.patientService.getPatientByUHID(req['user'], uhid);
  }

  @Get('search-uhid')
  async searchUHID(@Req() req: Request, @Query('query') query: string) {
    return this.patientService.searchUHID(req['user'], query);
  }

  @Get('by-employee-id')
  async getPatientByEmployeeId(
    @Query('employeeId') employeeId: string,
  ): Promise<DRIVERMASTER> {
    if (!employeeId || employeeId.trim() === '') {
      throw new BadRequestException('employeeId is required');
    }

    return this.patientService.findByEmployeeId(employeeId);
  }

  @Get('search-employee')
  async searchEmployee(@Req() req: Request, @Query('query') query: string) {
    return this.patientService.searchEmployeeId(req['user'], query);
  }

  @Get('search-name')
  async searchName(@Req() req: Request, @Query('query') query: string) {
    return this.patientService.searchName(req['user'], query);
  }

  @Get('search-name-full')
  async searchNameFull(@Req() req: Request, @Query('query') query: string) {
    return this.patientService.searchNameFull(req['user'], query);
  }
  @Delete(':id')
  async deletePatient(@Req() req: Request, @Param('id') id: number) {
    const result = await this.patientService.softDeletePatient(Number(id));
    const userV = req['user'];

    await GlobalHelper.createUserLogs({
      user_id: userV.id,
      action_type: 'delete_Patient ',
      action_description: `Deleted Patient ID: ${id}`,
      user_ip: req.ip,
      action_time: new Date(),
    });

    return result;
  }
  @Get('due/:uhid')
  async getDue(@Param('uhid') uhid: string) {
    if (!uhid) {
      throw new BadRequestException('UHID is required');
    }

    const PreviousDue = await this.patientService.getDueAmountByUHID(uhid);

    return {
      uhid,
      PreviousDue,
    };
  }
  @Get('trend')
  async getPatientsTrend(@Req() req: Request) {
    return this.patientService.getPatientsTrend(req['user']);
  }
}
