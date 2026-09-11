import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';

import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { PackagemanagementService } from './packagemanagement.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/package-management')
export class PackagemanagementController {
  constructor(
    private readonly service: PackagemanagementService,
  ) {}
  @Post()
  async addPackage(
    @Body() body: any,
  ) {
    return this.service.addPackage(body);
  }
  @Get()
  async listPackage(
    @Query() query: any,
  ) {
    return this.service.listPackage(query);
  }
  @Get(':id')
  async packageDetails(
    @Param('id') id: number,
    @Query() query: any,
  ) {
    return this.service.packageDetails({
      id,
      ...query,
    });
  }

  @Put(':id')
  async updatePackage(
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.service.updatePackage({
      id,
      ...body,
    });
  }
  @Delete(':id')
  async deletePackage(
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.service.deletePackage({
      id,
      ...body,
    });
  }
}