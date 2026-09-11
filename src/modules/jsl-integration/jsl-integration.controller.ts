import { Body, Controller, Post } from '@nestjs/common';
import { JslIntegrationService } from './jsl-integration.service';
import { JslRequestDto } from './dto/jsl-request.dto';
import { JslSurveyResponse } from './models/jsl-response.model';

/**
 * Controller that exposes endpoints for JSL CPI integration.
 */
@Controller('jsl')
export class JslIntegrationController {
  constructor(private readonly jslService: JslIntegrationService) {}

  /**
   * Retrieve survey details for the provided serial number from JSL CPI.
   */
  @Post('lmc')
  async executeJsl(@Body() body: JslRequestDto): Promise<JslSurveyResponse> {
    return this.jslService.sendJslRequest(body);
  }

  /**
   * Smoke test endpoint to verify controller wiring.
   */
  @Post('admin/test')
  async adminTest(): Promise<{ status: string }> {
    return { status: 'ok' };
  }
}


