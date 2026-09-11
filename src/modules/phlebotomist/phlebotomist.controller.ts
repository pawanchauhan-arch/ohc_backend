import { 
  Body, 
  Controller, 
  Delete, 
  Get, 
  Param, 
  Patch, 
  Post, 
  Query, 
  BadRequestException,
  UploadedFiles
} from '@nestjs/common';
import { PhlebotomistService } from './phlebotomist.service';
import { CreatePhlebotomistDto, UpdatePhlebotomistDto, AssignPhlebotomistDto, AssignPhlebotomistByCodeDto } from './dto';
import { CenterUser } from '../../models/CenterUser';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadedFile } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';

/**
 * Controller for managing phlebotomists and their camp assignments
 */
@Controller('api/phlebotomists')
export class PhlebotomistController {
  constructor(private readonly phlebotomistService: PhlebotomistService) {}

  /**
   * Validates and converts center_id parameter
   */
  private validateCenterId(center_id: string | number): number {
    const centerId = Number(center_id);
    if (isNaN(centerId) || centerId <= 0) {
      throw new BadRequestException('Valid center_id is required');
    }
    return centerId;
  }

  @Post('update-image-proof')
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'idProof', maxCount: 1 },
    { name: 'image', maxCount: 1 }
  ]))
  async updatePhlebotomistImage(
    @Body() dto: { phelboId: number, dob: string },
    @UploadedFiles() files: { 
      idProof?: Express.Multer.File[],
      image?: Express.Multer.File[] 
    }
  ) {
    if (!files.idProof?.[0] || !files.image?.[0]) {
      throw new BadRequestException('Both idProof and image files are required');
    }
    
    return this.phlebotomistService.updatePhlebotomistImage(
      dto.phelboId, 
      dto.dob, 
      files.idProof[0], 
      files.image[0]
    );
  }

  /**
   * Create a new phlebotomist
   * POST /api/phlebotomists
   */
  @Post()
  async createPhlebotomist(@Body() dto: CreatePhlebotomistDto, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    const phlebotomist = await this.phlebotomistService.createPhlebotomist(dto, centerId);
    
    return {
      success: true,
      message: 'Phlebotomist created successfully',
      data: {
        id: phlebotomist.id,
        user_id: phlebotomist.user_id,
        center_id: phlebotomist.center_id,
        user_type: phlebotomist.user_type,
        signature: phlebotomist.signature,
        short_code: phlebotomist.short_code,
        createdAt: phlebotomist.createdAt,
        updatedAt: phlebotomist.updatedAt,
        user: {
          id: phlebotomist.user.id,
          username: phlebotomist.user.username,
          name: phlebotomist.user.name,
          email: phlebotomist.user.email,
          phone: phlebotomist.user.phone,
          role_id: phlebotomist.user.role_id,
          status: phlebotomist.user.status
        }
      }
    };
  }

  /**
   * List all phlebotomists for a center
   * GET /api/phlebotomists?center_id=X
   */
  @Get()
  async listPhlebotomists(@Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    const phlebotomists = await this.phlebotomistService.listPhlebotomists(centerId);
    
    // Return clean response without center info
    return phlebotomists
      .filter(phlebotomist => phlebotomist.user)
      .map(phlebotomist => ({
      id: phlebotomist.id,
      user_id: phlebotomist.user_id,
      center_id: phlebotomist.center_id,
      user_type: phlebotomist.user_type,
      signature: phlebotomist.signature,
      short_code: phlebotomist.short_code,
      createdAt: phlebotomist.createdAt,
      updatedAt: phlebotomist.updatedAt,
      user: {
        id: phlebotomist.user.id,
        username: phlebotomist.user.username,
        name: phlebotomist.user.name,
        email: phlebotomist.user.email,
        phone: phlebotomist.user.phone,
        role_id: phlebotomist.user.role_id,
        status: phlebotomist.user.status
      }
    }));
  }

  /**
   * Search phlebotomists by phone number or employee code
   * GET /api/phlebotomists/search?center_id=X&phone=XXX&employee_code=XXX
   */
  @Get('search')
  async searchPhlebotomists(
    @Query('center_id') center_id: string,
    @Query('phone') phone?: string,
    @Query('employee_code') employee_code?: string
  ) {
    const centerId = this.validateCenterId(center_id);
    
    if (!phone && !employee_code) {
      throw new BadRequestException('Either phone or employee_code must be provided');
    }
    
    // Fix URL encoding issue: if phone starts with space, replace with +
    if (phone && phone.startsWith(' ')) {
      phone = '+' + phone.substring(1);
    }
    
    const phlebotomists = await this.phlebotomistService.searchPhlebotomists(centerId, phone, employee_code);
    
    // Return clean response without center info
    return phlebotomists.map(phlebotomist => ({
      id: phlebotomist.id,
      user_id: phlebotomist.user_id,
      center_id: phlebotomist.center_id,
      user_type: phlebotomist.user_type,
      signature: phlebotomist.signature,
      short_code: phlebotomist.short_code,
      createdAt: phlebotomist.createdAt,
      updatedAt: phlebotomist.updatedAt,
      user: {
        id: phlebotomist.user.id,
        username: phlebotomist.user.username,
        name: phlebotomist.user.name,
        email: phlebotomist.user.email,
        phone: phlebotomist.user.phone,
        role_id: phlebotomist.user.role_id,
        status: phlebotomist.user.status
      }
    }));
  }

  /**
   * Get phlebotomist by phone number using query parameter
   */
  @Get('getPhlebotomistData')
  async getPhlebotomistByPhoneNumber(
    @Query('phoneNumber') phoneNumber: string,
  ): Promise<CenterUser & { name?: string }> {
    console.log('Received phone number:', phoneNumber);
    console.log('Type of phone number:', typeof phoneNumber);

    // Call the service method
    return this.phlebotomistService.getPhlebotomistByPhoneNumber(phoneNumber);
  }

  /**
   * Get camp items assigned to a phlebotomist with patient details
   * GET /api/phlebotomists/:id/camp-items
   */
  @Get(':id/camp-items')
  async getPhlebotomistCampItems(@Param('id') id: string) {
    const phlebotomistId = Number(id);
    if (isNaN(phlebotomistId) || phlebotomistId <= 0) {
      throw new BadRequestException('Valid phlebotomist ID is required');
    }

    return this.phlebotomistService.getPhlebotomistCampItems(phlebotomistId);
  }


  /**
   * Get phlebotomist details
   * GET /api/phlebotomists/:id?center_id=X
   */
  @Get(':id')
  async getPhlebotomist(
    @Param('id') id: string,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    const phlebotomist = await this.phlebotomistService.getPhlebotomist(Number(id), centerId);
    
    // Return clean response without center info
    return {
      id: phlebotomist.id,
      user_id: phlebotomist.user_id,
      center_id: phlebotomist.center_id,
      user_type: phlebotomist.user_type,
      signature: phlebotomist.signature,
      short_code: phlebotomist.short_code,
      createdAt: phlebotomist.createdAt,
      updatedAt: phlebotomist.updatedAt,
      user: {
        id: phlebotomist.user.id,
        username: phlebotomist.user.username,
        name: phlebotomist.user.name,
        email: phlebotomist.user.email,
        phone: phlebotomist.user.phone,
        role_id: phlebotomist.user.role_id,
        status: phlebotomist.user.status
      }
    };
  }

  /**
   * Update phlebotomist details
   * PATCH /api/phlebotomists/:id?center_id=X
   */
  @Patch(':id')
  async updatePhlebotomist(
    @Param('id') id: string,
    @Body() dto: UpdatePhlebotomistDto,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    const phlebotomist = await this.phlebotomistService.updatePhlebotomist(Number(id), centerId, dto);
    
    // Return clean response without center info
    return {
      success: true,
      message: 'Phlebotomist updated successfully',
      data: {
        id: phlebotomist.id,
        user_id: phlebotomist.user_id,
        center_id: phlebotomist.center_id,
        user_type: phlebotomist.user_type,
        signature: phlebotomist.signature,
        short_code: phlebotomist.short_code,
        createdAt: phlebotomist.createdAt,
        updatedAt: phlebotomist.updatedAt,
        user: {
          id: phlebotomist.user.id,
          username: phlebotomist.user.username,
          name: phlebotomist.user.name,
          email: phlebotomist.user.email,
          phone: phlebotomist.user.phone,
          role_id: phlebotomist.user.role_id,
          status: phlebotomist.user.status
        }
      }
    };
  }

  /**
   * Delete phlebotomist
   * DELETE /api/phlebotomists/:id?center_id=X
   */
  @Delete(':id')
  async deletePhlebotomist(
    @Param('id') id: string,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    await this.phlebotomistService.deletePhlebotomist(Number(id), centerId);
    return { success: true };
  }

  /**
   * Get camps assigned to a phlebotomist
   * GET /api/phlebotomists/:id/camps?center_id=X
   */
  @Get(':id/camps')
  async getPhlebotomistCamps(
    @Param('id') id: string,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.phlebotomistService.getPhlebotomistCamps(Number(id), centerId);
  }

  /**
   * Get specific camp details for phlebotomist
   * GET /api/phlebotomists/:id/camps/:campId?center_id=X
   */
  @Get(':id/camps/:campId')
  async getPhlebotomistCamp(
    @Param('id') id: string,
    @Param('campId') campId: string,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.phlebotomistService.getPhlebotomistCamp(Number(campId), Number(id), centerId);
  }
}

/**
 * Controller for camp-phlebotomist assignments
 */
@Controller('api/camps')
export class CampPhlebotomistController {
  constructor(private readonly phlebotomistService: PhlebotomistService) {}

  /**
   * Validates and converts center_id parameter
   */
  private validateCenterId(center_id: string | number): number {
    const centerId = Number(center_id);
    if (isNaN(centerId) || centerId <= 0) {
      throw new BadRequestException('Valid center_id is required');
    }
    return centerId;
  }

  /**
   * Assign phlebotomists to a camp
   * POST /api/camps/:campId/phlebotomists?center_id=X
   */
  @Post(':campId/phlebotomists')
  async assignPhlebotomistsToCamp(
    @Param('campId') campId: string,
    @Body() dto: AssignPhlebotomistDto,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.phlebotomistService.assignPhlebotomistsToCamp(Number(campId), centerId, dto);
  }

  /**
   * Add phlebotomists to a camp (additive - doesn't replace existing)
   * POST /api/camps/:campId/phlebotomists/add?center_id=X
   */
  @Post(':campId/phlebotomists/add')
  async addPhlebotomistsToCamp(
    @Param('campId') campId: string,
    @Body() dto: AssignPhlebotomistDto,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.phlebotomistService.addPhlebotomistsToCamp(Number(campId), centerId, dto);
  }

  /**
   * Add phlebotomists to a camp using employee codes (additive - doesn't replace existing)
   * POST /api/camps/:campId/phlebotomists/add/by-code?center_id=X
   */
  @Post(':campId/phlebotomists/add/by-code')
  async addPhlebotomistsToCampByCode(
    @Param('campId') campId: string,
    @Body() dto: AssignPhlebotomistByCodeDto,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.phlebotomistService.addPhlebotomistsToCampByCode(Number(campId), centerId, dto);
  }

  /**
   * Assign phlebotomists to a camp using employee codes
   * POST /api/camps/:campId/phlebotomists/by-code?center_id=X
   */
  @Post(':campId/phlebotomists/by-code')
  async assignPhlebotomistsToCampByCode(
    @Param('campId') campId: string,
    @Body() dto: AssignPhlebotomistByCodeDto,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.phlebotomistService.assignPhlebotomistsToCampByCode(Number(campId), centerId, dto);
  }

  /**
   * Get assigned phlebotomists for a camp
   * GET /api/camps/:campId/phlebotomists?center_id=X
   */
  @Get(':campId/phlebotomists')
  async getCampPhlebotomists(
    @Param('campId') campId: string,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    const phlebotomists = await this.phlebotomistService.getCampPhlebotomists(Number(campId), centerId);
    
    // Return clean response without center info
    return phlebotomists.map(phlebotomist => ({
      id: phlebotomist.id,
      user_id: phlebotomist.user_id,
      center_id: phlebotomist.center_id,
      user_type: phlebotomist.user_type,
      signature: phlebotomist.signature,
      short_code: phlebotomist.short_code,
      createdAt: phlebotomist.createdAt,
      updatedAt: phlebotomist.updatedAt,
      user: {
        id: phlebotomist.user.id,
        username: phlebotomist.user.username,
        name: phlebotomist.user.name,
        email: phlebotomist.user.email,
        phone: phlebotomist.user.phone,
        role_id: phlebotomist.user.role_id,
        status: phlebotomist.user.status
      }
    }));
  }

  /**
   * Unassign phlebotomist from camp
   * DELETE /api/camps/:campId/phlebotomists/:phlebotomistId?center_id=X
   */
  @Delete(':campId/phlebotomists/:phlebotomistId')
  async unassignPhlebotomistFromCamp(
    @Param('campId') campId: string,
    @Param('phlebotomistId') phlebotomistId: string,
    @Query('center_id') center_id: string
  ) {
    const centerId = this.validateCenterId(center_id);
    await this.phlebotomistService.unassignPhlebotomistFromCamp(Number(campId), Number(phlebotomistId), centerId);
    return { success: true };
  }

}
