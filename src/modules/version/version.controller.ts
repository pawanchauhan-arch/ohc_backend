import { Controller, Get } from '@nestjs/common';
import { VersionService } from './version.service';

/**
 * Controller for handling version-related endpoints
 */
@Controller('api/version')
export class VersionController {
  constructor(private readonly versionService: VersionService) {}

  /**
   * Get the current application version
   * @returns Object containing the app version
   */
  @Get()
  getAppVersion(): { version: string } {
    return { version: this.versionService.getAppVersion() };
  }
} 