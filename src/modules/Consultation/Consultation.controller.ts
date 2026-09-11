import { Controller, Get, Post, Put, Delete, Options, Param, Body, NotFoundException, Query, Req } from '@nestjs/common';
import { ConsultationService } from './Consultation.service';
import { Consultation } from '../../models/Consultation';
import { PaginationResponse } from '../../models/PaginationResponse';

@Controller('api/consultations')
export class ConsultationController {
  constructor(private readonly consultationService: ConsultationService) { }

  @Post()
  async createConsultation(@Body() consultationData: Partial<Consultation>): Promise<Consultation> {
    return this.consultationService.createConsultation(consultationData);
  }

  /**
   * Get consultations list with pagination and filtering
   * @param centerID - Filter by center ID (optional)
   * @param limit - Number of records to return (default: 1000)
   * @param offset - Number of records to skip (default: 0)
   * @returns Array of consultations with driver and center details
   */
  @Get('/list')
  async getAllConsultations(
    @Query('centerID') centerID?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<Consultation[]> {
    const centerIdNumber = centerID ? parseInt(centerID, 10) : undefined;
    const limitNumber = limit ? parseInt(limit, 10) : 1000;
    const offsetNumber = offset ? parseInt(offset, 10) : 0;
    return this.consultationService.getAllConsultations(limitNumber, offsetNumber, centerIdNumber);
  }

  /**
   * Get consultations list with full pagination metadata
   * @param page - Page number (default: 1)
   * @param limit - Number of records per page (default: 20)
   * @param centerID - Filter by center ID (optional)
   * @param daysBack - Number of days back to fetch consultations (optional - if not provided, returns all consultations)
   * @param centerGroupIds - Filter by center group IDs array (optional)
   * @returns Paginated response with consultations data and pagination metadata
   */
  @Get('/list/paginated')
  async getAllConsultationsPaginated(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('centerID') centerID?: string,
    @Query('daysBack') daysBack?: string,
    @Query('centerGroupIds') centerGroupIds?: string | string[],
  ): Promise<PaginationResponse<Consultation>> {
    const pageNumber = page ? parseInt(page, 10) : 1;
    const limitNumber = limit ? parseInt(limit, 10) : 20;
    const centerIdNumber = centerID ? parseInt(centerID, 10) : undefined;
    const daysBackNumber = daysBack ? parseInt(daysBack, 10) : undefined;
    
    // Handle centerGroupIds as array (can be string, string[], or comma-separated string)
    let centerGroupIdsArray: number[] | undefined;
    if (centerGroupIds) {
      if (Array.isArray(centerGroupIds)) {
        centerGroupIdsArray = centerGroupIds.map(id => parseInt(id, 10)).filter(id => !isNaN(id));
      } else if (typeof centerGroupIds === 'string') {
        // Handle comma-separated string or single value
        centerGroupIdsArray = centerGroupIds
          .split(',')
          .map(id => parseInt(id.trim(), 10))
          .filter(id => !isNaN(id));
      }
    }

    return this.consultationService.getAllConsultationsPaginated(
      pageNumber,
      limitNumber,
      centerIdNumber,
      daysBackNumber,
      centerGroupIdsArray
    );
  }
  @Get('/analysis')
  async getConsultations(
    @Query('user_id') userId: string,
    @Query() query: any,
  ) {
    return this.consultationService.getConsultationsForUser(Number(userId), query);
  }


  @Get(':id')
  async getConsultationById(@Param('id') id: string): Promise<Consultation> {
    const consultation = await this.consultationService.getConsultationById(id);
    if (!consultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found.`);
    }
    return consultation;
  }

  @Get('driver/:driverId')
  async getConsultationsByDriverId(@Param('driverId') driverId: number): Promise<Consultation[]> {
    return this.consultationService.getConsultationsByDriverId(driverId);
  }

  @Put(':id')
  async updateConsultation(
    @Param('id') id: string,
    @Body() consultationData: Partial<Consultation>,
  ): Promise<Consultation> {
    const updatedConsultation = await this.consultationService.updateConsultation(id, consultationData);
    if (!updatedConsultation) {
      throw new NotFoundException(`Consultation with ID ${id} not found.`);
    }
    return updatedConsultation;
  }

  @Delete(':id')
  async deleteConsultation(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.consultationService.deleteConsultation(id);
    if (!success) {
      throw new NotFoundException(`Consultation with ID ${id} not found.`);
    }
    return { success };
  }
  @Get('driver/:driverId/completed')
  async getCompletedConsultationsByDriverId(@Param('driverId') driverId: number) {
    return this.consultationService.getCompletedConsultationsByDriverId(driverId);
  }
  @Get('latest/:requestId')
  async getLatestConsultationByRequestId(@Param('requestId') requestId: string) {
    return this.consultationService.getLatestConsultationByRequestId(requestId);
  }

  @Options('mark-complete/:id')
  async markConsultationCompleteOptions(@Param('id') id: string): Promise<void> {
    // This handles CORS preflight requests for the mark-complete endpoint
    return;
  }

  @Put('mark-complete/:id')
  async markConsultationComplete(@Param('id') id: string): Promise<Consultation> {
    return this.consultationService.markConsultationComplete(id);
  }

  @Get('doctor/:doctorId')
  async getConsultationsByDoctorId(@Param('doctorId') doctorId: number): Promise<(Consultation & { driver_name?: string })[]> {
    console.log('Received doctorId:', doctorId);
    return this.consultationService.getConsultationsByDoctorId(doctorId);
  }
  @Get('doctorAll/:doctorId')
  async getAllConsultationsByDoctorId(@Param('doctorId') doctorId: number): Promise<(Consultation & { driver_name?: string })[]> {
    console.log('Received doctorId:', doctorId);
    return this.consultationService.getAllConsultationsByDoctorId(doctorId);
  }


}
