import {
  Controller,
  Get,
} from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return {
      status: 'UP',
      timestamp: new Date(),
    };
  }

  @Get('live')
  live() {
    return {
      status: 'UP',
    };
  }

  @Get('ready')
  ready() {
    return {
      status: 'UP',
    };
  }
}
