import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
  } from '@nestjs/common';
  import { CenterService } from './center.service';
  import { GetCentersDto, CentersListResponseDto } from './dto/get-centers.dto';
  
  @Controller('api/center')
  export class CenterController {
    constructor(private readonly centerService: CenterService) {}
  
    /**
     * Get all centers mapped to a CET or Corporate ID
     * POST /api/center/centers
     * Body: { id: number, roleType: string }
     */
    @Post('centers')
    @HttpCode(HttpStatus.OK)
    async getCentersByRole(
      @Body() dto: GetCentersDto,
    ): Promise<CentersListResponseDto> {
      return this.centerService.getCentersByRole(dto);
    }
  }