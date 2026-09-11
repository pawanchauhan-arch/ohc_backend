import { Injectable } from '@nestjs/common';

/**
 * Service for handling version-related operations
 */
@Injectable()
export class VersionService {
  /**
   * Get the current application version from environment variables
   * @returns The application version string
   */
  getAppVersion(): string {
    return process.env.APP_VERSION || '1.0.0';
  }
} 