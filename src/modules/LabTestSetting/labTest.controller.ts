import { Body, Controller, Get, Param, Post, Res, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { LabSettingsService } from './labTest.service';


@Controller('api/lab-settings')
export class LabSettingsController {
  constructor(private readonly labSettingsService: LabSettingsService) {}

  /**
   * Endpoint: POST /lab-settings/sync
   * Body: { object } OR [ array of objects ]
   */
  @Post('sync')
  async sync(
    @Body() body: any, 
    @Res() res: Response
  ) {
    try {
      const result = await this.labSettingsService.syncSettings(body);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Settings synchronized successfully',
        data: result,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  }

  /**
   * Endpoint: GET /lab-settings/profile/:profileName
   * Example: GET /lab-settings/profile/cbc
   */
  @Get('profile/:profileName')
  async getByProfile(@Param('profileName') profileName: string) {
    return {
      success: true,
      profile: profileName,
      data: await this.labSettingsService.getByProfile(profileName),
    };
  }

  /**
   * Endpoint: GET /lab-settings
   */
  @Get()
  async getAll() {
    return {
      success: true,
      data: await this.labSettingsService.findAll(),
    };
  }
}