import { Controller, Get, Query, Post, Body } from '@nestjs/common';
import { DiseaseService } from './disease.service';
import { CreateDiseaseDto } from './dto/create-disease.dto';
@Controller('api/diseases')
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Get('search')
  async searchDiseases(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.diseaseService.searchDiseases(query, page, limit);
  }
  @Post()
  async createDisease(@Body() body: CreateDiseaseDto) {
    return this.diseaseService.createDisease(body);
  }
}
