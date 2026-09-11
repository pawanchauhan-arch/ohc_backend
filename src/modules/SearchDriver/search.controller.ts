import { Controller, Post, Body, Res } from '@nestjs/common';
import { Response } from 'express';
import { SearchService, DriverSearchResponse } from './search.service';

@Controller('api/driver')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post('/search')
  async searchWorkforce(@Body() body: any): Promise<DriverSearchResponse> {
    return this.searchService.searchDriver(body);
  }

  @Post('/unique-patients/export')
  async exportUniquePatients(
    @Body() body: any,
    @Res() res: Response,
  ): Promise<void> {
    await this.searchService.exportUniquePatientsCsv(body, res);
  }
}
