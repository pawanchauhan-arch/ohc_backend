import { Controller, Get, Param, Query, NotFoundException, BadRequestException, Req, Post, Body } from '@nestjs/common';
import { DriverHealthCheckupService } from './DriverHealthCheckup.service';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { DriverHealthStats } from '../../models/DriverHealthStats';
import { DownloadHealthRecordDto } from './dto/download-health-record.dto';
import { LatestEcgByDriverResponse } from './dto/latest-ecg-response.type';

@Controller('api/driver-health-checkup')
export class DriverHealthCheckupController {
  constructor(private readonly driverHealthCheckupService: DriverHealthCheckupService) {}

  /**
   * Fetch driver health checkup records by phone number.
   */
  @Get('by-phone')
  async getDriverHealthCheckupByPhoneNumber(
    @Query('phoneNumber') phoneNumber: string,
  ): Promise<driverhealthcheckup[]> {
    return this.driverHealthCheckupService.getDriverHealthCheckupByPhoneNumber(phoneNumber);
  }

  @Get('by-id')
  async getDriverHealthCheckupByDriverID(
    @Query('driver_id') driver_id: string, // driver_id is passed as a string in the query
  ): Promise<driverhealthcheckup> { // Return type is now a single object, not an array
    // Parse driver_id as a number
    const driverId = parseInt(driver_id, 10);
  
    // Call the service method to get the latest health checkup
    return this.driverHealthCheckupService.getDriverHealthCheckupByDriverID(driverId);
  }

  /**
   * Fetch the latest confirmed ECG record for a driver, walking older checkups
   * when newer records lack a valid ecg_unit.doc URL.
   */
  @Get('latest-ecg')
  async getLatestEcgByDriverId(
    @Query('driver_id') driver_id: string,
  ): Promise<LatestEcgByDriverResponse> {
    const driverId = parseInt(driver_id, 10);
    if (Number.isNaN(driverId)) {
      throw new BadRequestException('Invalid driver_id');
    }
    return this.driverHealthCheckupService.getLatestEcgByDriverId(driverId);
  }
  /**
   * Fetch all driver health checkup records by driver ID.
   */
  @Get('all-by-id')
  async listDriverHealthCheckupsByDriverID(
    @Query('driver_id') driver_id: string,
  ): Promise<driverhealthcheckup[]> {
    const driverId = parseInt(driver_id, 10);
    return this.driverHealthCheckupService.listDriverHealthCheckupsByDriverID(driverId);
  }

  /**
   * Populate diabetes and cardiac health stats for a driver.
   */
  @Get('populate-stats/:driverId')
  async populateDriverHealthStats(
    @Param('driverId') driverId: number,
  ): Promise<DriverHealthStats> {
    return await this.driverHealthCheckupService.populateDriverHealthStats(driverId);
  }

  /**
   * Fetch the health stats for a driver.
   */
  @Get('stats/:driverId')
  async getDriverHealthStats(@Param('driverId') driverId: number): Promise<DriverHealthStats> {
    const healthStats = await this.driverHealthCheckupService.getDriverHealthStats(driverId);
  
    if (!healthStats) {
      throw new NotFoundException(`Health stats not found for driver with ID: ${driverId}`);
    }
  
    return healthStats;
  }
  /**
   * Populate health stats for all drivers
   */
  @Get('populate-Allstats/all')
  async populateHealthStatsForAllDrivers(): Promise<{ message: string }> {
    await this.driverHealthCheckupService.populateHealthStatsForAllDrivers();
    return { message: 'Health stats populated for all drivers.' };
  }

//   @Get('full-details-by-phone')
// async getFullHealthCheckupDetailsByPhone(
//   @Query('phoneNumber') phoneNumber: string,
// ): Promise<any> {
//   return this.driverHealthCheckupService.getFullHealthCheckupDetailsByPhone(phoneNumber);
// }

@Get('full-details-by-id')
async getFullHealthCheckupDetailsById(
  @Query('healthCheckupId') healthCheckupId: string,
): Promise<any> {
  return this.driverHealthCheckupService.getFullHealthCheckupDetailsById(healthCheckupId);
}


@Post('download')
  async downloadHealthCheckupRecords(
    @Body() dto: DownloadHealthRecordDto,
  ) {
    return this.driverHealthCheckupService.downloadHealthCheckupRecords(dto);
  }

}
