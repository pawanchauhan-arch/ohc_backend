import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import * as cron from 'node-cron';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';
import { PrescriptionService } from '../Prescription/Prescription.service';

/**
 * Service responsible for scheduling and executing periodic tasks
 */
@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly prescriptionService: PrescriptionService
  ) {
    this.baseUrl = this.configService.getBaseUrl();
    this.logger.log(`Scheduler service initialized with base URL: ${this.baseUrl}`);
  }

  /**
   * Initialize all scheduled tasks when the application starts
   */
  public initScheduledTasks(): void {
    this.scheduleDriverHealthStatsPopulation();
    this.schedulePrescriptionHealthRecordMapping();
  }

  /**
   * Schedule the driver health stats population task to run at 12am daily
   */
  private scheduleDriverHealthStatsPopulation(): void {
    // Schedule task to run at 12:00 AM every day
    // Cron format: second(0-59) minute(0-59) hour(0-23) day(1-31) month(1-12) day of week(0-6)(Sunday=0)
    cron.schedule('0 0 0 * * *', async () => {
      try {
        this.logger.log('Running scheduled task: Populating driver health stats');
        
        // Make the API call to populate all stats
        const response = await firstValueFrom(
          this.httpService.get(`${this.baseUrl}/driver-health-checkup/populate-Allstats/all`)
        );
        
        this.logger.log(`Task completed with status: ${response.status}`);
        this.logger.debug(`Response data: ${JSON.stringify(response.data)}`);
      } catch (error) {
        this.logger.error('Failed to execute scheduled task for driver health stats', error.stack);
      }
    }, {
      timezone: "Asia/Kolkata" // Set to Indian timezone
    });
    
    this.logger.log('Driver health stats population scheduled for 12:00 AM daily (Asia/Kolkata).');
  }

  /**
   * Schedule the prescription to health record mapping task to run every 15 minutes
   * Calls the service method directly for security and maintainability (avoids HTTP and auth issues)
   */
  private schedulePrescriptionHealthRecordMapping(): void {
    // Runs every 15 minutes.
    cron.schedule('0 */15 * * * *', async () => {
      this.logger.log('Running scheduled task: Mapping prescriptions to driver health records');
      try {
        // Directly call the service method instead of HTTP for security and maintainability
        const result = await this.prescriptionService.mapPrescriptionsToHealthRecords();
        this.logger.log(`Prescription mapping task completed. Processed: ${result.processed}, Mapped: ${result.mapped}, Failed: ${result.failedToMap.length}`);
      } catch (error) {
        this.logger.error(`Failed to execute scheduled prescription mapping task: ${error.message}`, error.stack);
      }
    }, {
      timezone: "Asia/Kolkata"
    });
    this.logger.log('Prescription to health record mapping task scheduled for every 15 minutes (Asia/Kolkata).');
  }
} 