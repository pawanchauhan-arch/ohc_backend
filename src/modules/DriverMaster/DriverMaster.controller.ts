import { Controller, Get, Query, Body, NotFoundException, Post, Put, Param, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { DriverMasterService } from './DriverMaster.service';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/drivers')
export class DriverMasterController {
  constructor(private readonly driverMasterService: DriverMasterService) {}

  /**
   * Validates and converts center_id parameter
   */
  private validateCenterId(center_id: string | number): number {
    const centerId = Number(center_id);
    if (isNaN(centerId) || centerId <= 0) {
      throw new BadRequestException('Valid center_id is required');
    }
    return centerId;
  }

  @Get('getUserData')
  async getDriverByPhoneNumber(@Query('phoneNumber') phoneNumber: string): Promise<DRIVERMASTER[]> {
    return this.driverMasterService.getDriverByPhoneNumber(phoneNumber);
  }

  @Get('getUserDataByID')
  async getDriverByDriverID(@Query('driverID') driverID: number): Promise<DRIVERMASTER> {
    return this.driverMasterService.getDriverByDriverID(driverID);
  }

  @Get('emergencyContacts')
  async getEmergencyContacts(@Query('phoneNumber') phoneNumber: string): Promise<{emergencyContactName: string; emergencyContactNumber: string}>{
    return this.driverMasterService.getEmergencyContacts(phoneNumber);
  }

  @Post('update-abha-details')
  async updateAbhaDetails(
    @Body('driverId') driverId: number,
    @Body('abhaNumber') abhaNumber: string,
    @Body('abhaDetails') abhaDetails : any
  ): Promise<DRIVERMASTER> {
    if (!driverId || !abhaNumber) {
      throw new NotFoundException('Driver ID and ABHA Number are required.');
    }

    return this.driverMasterService.updateAbhaDetails(driverId, abhaNumber, abhaDetails);
  }

  @Post('register-driver')
  async registerDriver(@Body() driverData: Partial<DRIVERMASTER>): Promise<{ message: string; driver?: DRIVERMASTER }> {
    if (!driverData.name || !driverData.contactNumber || !driverData.gender) {
      throw new NotFoundException(
        'Name, Contact Number, and Gender are required.',
      );
    }
    return this.driverMasterService.registerDriver(driverData);
  }

  @Put('ban/:id')
  async banDriver(@Param('id') driver_id: number): Promise<{ success: boolean }> {
    const success = await this.driverMasterService.banDriver(Number(driver_id));
    return { success };
  }

  // Patients CSV import (operators): requires cetId query and CSV with employee_id, client_id
  @Post('import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importDriversCsv(
    @UploadedFile() file: Express.Multer.File,
    @Query('cetId') cetId: string,
    @Query('center_id') center_id: string,
  ) {
    const centerId = this.validateCenterId(center_id);
    const cetIdNum = Number(cetId);
    if (isNaN(cetIdNum) || cetIdNum <= 0) {
      throw new BadRequestException('Valid cetId is required');
    }
    return this.driverMasterService.importDriversCsv(centerId, cetIdNum, file);
  }
  
  @Put('update-driver')
  async updateDriver(@Body() driverData: Partial<DRIVERMASTER>): Promise<{ message: string; driver?: DRIVERMASTER }> {
    return this.driverMasterService.updateDriver(driverData);
  }
}