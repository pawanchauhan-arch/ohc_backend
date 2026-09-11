import { Injectable } from '@nestjs/common';

/**
 * Service for providing configuration values
 */
@Injectable()
export class ConfigService {
  /**
   * Get the base URL for API calls
   */
  public getBaseUrl(): string {
    // In production, we should use the actual hostname or IP
    // For internal API calls on the same server, we can use localhost or 127.0.0.1
    const host = process.env.API_HOST || 'localhost';
    const port = process.env.PORT || 3000;
    
    // For internal scheduler calls, we can use the loopback address
    // since the scheduler is running on the same machine as the API
    // return `http://127.0.0.1:${port}/`;
    return `http://mobile-api.lastmilecare.in/`;
  }
} 