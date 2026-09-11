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

import { DepartmentService } from './ohc-department.service';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
@UseGuards(JwtAdminGuardB2C)
@Controller('api/departments')
export class DepartmentController {
  constructor(
    private readonly departmentService: DepartmentService,
  ) {}

  /**
   * Create Department
   */
  @Post()
  async create(@Body() body: any) {
    return this.departmentService.create(body);
  }

  /**
   * Get Department List
   */
  @Get()
  async findAll(@Query() query: any) {
    return this.departmentService.findAll(query);
  }

  /**
   * Get Department By ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departmentService.findOne(id);
  }

  /**
   * Update Department
   */
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.departmentService.update(id, body);
  }

  /**
   * Delete Department
   */
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departmentService.remove(id);
  }

  /**
   * Toggle Department Status
   */
  @Patch(':id/toggle-status')
  async toggleStatus(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.departmentService.toggleStatus(id);
  }
}