import { Controller, Post, Body, UsePipes, ValidationPipe } from '@nestjs/common';
import { HealthService } from './health.service';
import { ShiftSummaryRequestDto } from './dto/shift-summary-request.dto';

@Controller('driver/view')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Post('/health-checkup')
  async viewHealthData(@Body() body: any) {
    return this.healthService.viewHealthData(body);
  }

  @Post('/health-checkup/shift-summary')
  @UsePipes(new ValidationPipe({ transform: true }))
  async getShiftSummary(@Body() body: ShiftSummaryRequestDto) {
    return this.healthService.getShiftSummary(body);
  }
}
