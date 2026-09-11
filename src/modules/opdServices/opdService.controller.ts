import {
  Controller,
  Get,
  Query,
  Body,
  BadRequestException,
  Post,
  Put,
  Param,
  Delete,
  InternalServerErrorException,
  Req,
  UseGuards
} from '@nestjs/common';
import { OpdService } from './opdService.service';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
@UseGuards(JwtAdminGuardB2C)
@Controller('api/opd-service')
export class OpdServiceController {
  constructor(private readonly opdService: OpdService) {}

  // ===========================
  // 🔹 SERVICE MASTER
  // ===========================

 @Get('service-master')
getAll(
  @Req() req: Request,
  @Query() query: any,
) {
  return this.opdService.getAllServiceMasters(
    req['user'],
    query,
  );
}

  @Get('service-master/:id')
  async getServiceMasterById(@Param('id') id: number) {
    return this.opdService.getServiceMasterById(id);
  }

  @Post('service-master')
  async createServiceMaster(@Body() data: any) {
    return this.opdService.createServiceMaster(data);
  }

  @Put('service-master/:id')
  async updateServiceMaster(@Param('id') id: number, @Body() data: any) {
    return this.opdService.updateServiceMaster(id, data);
  }

  @Delete('service-master/:id')
  async deleteServiceMaster(@Param('id') id: number) {
    return this.opdService.deleteServiceMaster(id);
  }

  // ===========================
  // 🔹 SERVICE TYPE MASTER
  // ===========================

  @Get('service-type')
  async getAllServiceTypes(@Query() query: any) {
    return this.opdService.getAllServiceTypes(query);
  }

  @Get('service-type/:id')
  async getServiceTypeById(@Param('id') id: number) {
    return this.opdService.getServiceTypeById(id);
  }

  @Post('service-type')
  async createServiceType(@Body() data: any) {
    return this.opdService.createServiceType(data);
  }

  @Put('service-type/:id')
  async updateServiceType(@Param('id') id: number, @Body() data: any) {
    return this.opdService.updateServiceType(id, data);
  }

  @Delete('service-type/:id')
  async deleteServiceType(@Param('id') id: number) {
    return this.opdService.deleteServiceType(id);
  }
}
