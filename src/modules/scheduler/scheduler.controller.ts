import { Controller, Post, Logger } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ConfigService } from './config.service';

/**
 * Controller for managing scheduled tasks
 */
@Controller('scheduler')
export class SchedulerController {
  private readonly logger = new Logger(SchedulerController.name);
  private readonly baseUrl: string;

  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {
    this.baseUrl = this.configService.getBaseUrl();
  }

  /**
   * Manually trigger the driver health stats population task
   */
  @Post('populate-driver-health-stats')
  async populateDriverHealthStats(): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log('Manually triggering driver health stats population');
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/driver-health-checkup/populate-Allstats/all`)
      );
      
      this.logger.log(`Task completed with status: ${response.status}`);
      
      return {
        success: true,
        message: 'Driver health stats population completed successfully'
      };
    } catch (error) {
      this.logger.error('Failed to execute task', error);
      
      return {
        success: false,
        message: `Failed to populate driver health stats: ${error.message}`
      };
    }
  }
} 