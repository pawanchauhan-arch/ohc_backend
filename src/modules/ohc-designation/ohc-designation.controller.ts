import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';

import { DesignationService } from './ohc-designation.service';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
@UseGuards(JwtAdminGuardB2C)
@Controller('api/designation')
export class DesignationController {
  constructor(
    private readonly designationService: DesignationService,
  ) {}

  /**
   * Create Designation
   */
  @Post()
  async create(@Body() body: any) {
    return this.designationService.create(body);
  }

  /**
   * Get Designation List
   */
  @Get()
  async findAll(@Query() query: any) {
    return this.designationService.findAll(query);
  }

  /**
   * Get Designation By ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.designationService.findOne(id);
  }

  /**
   * Update Designation
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.designationService.update(id, body);
  }

  /**
   * Delete Designation
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.designationService.remove(id);
  }

  /**
   * Toggle Designation Status
   */
  @Patch(':id/toggle-status')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.designationService.toggleStatus(id);
  }
}