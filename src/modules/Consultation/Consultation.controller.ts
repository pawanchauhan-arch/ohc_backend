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
   * Get consultations list with full pagination metadata (POST request to support large payloads)
   * @param body - JSON object containing filter parameters (page, limit, centerID, daysBack, centerGroupIds, status, startDate, endDate, doctorName)
   * @returns Paginated response with consultations data and pagination metadata
   */
  @Post('/list/paginated')
  async getAllConsultationsPaginated(
    @Body() body: any,
  ): Promise<PaginationResponse<Consultation>> {
    const pageNumber = body?.page ? parseInt(body.page, 10) : 1;
    const limitNumber = body?.limit ? parseInt(body.limit, 10) : 10;
    const daysBackNumber = body?.daysBack ? parseInt(body.daysBack, 10) : undefined;
    
    // Handle centerID as array of numbers (single value, comma-separated string, array, or number)
    let centerIdsArray: number[] | undefined;
    if (body?.centerID !== undefined && body?.centerID !== null && body?.centerID !== '') {
      if (Array.isArray(body.centerID)) {
        centerIdsArray = body.centerID.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
      } else if (typeof body.centerID === 'string') {
        centerIdsArray = body.centerID
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id));
      } else if (typeof body.centerID === 'number') {
        centerIdsArray = [body.centerID];
      }
    }

    // Handle status / iscomplete
    let isCompleteBool: boolean | undefined;
    if (body?.iscomplete !== undefined && body?.iscomplete !== null && body?.iscomplete !== '') {
      isCompleteBool = body.iscomplete === true || body.iscomplete === 'true' || body.iscomplete === '1';
    } else if (body?.status !== undefined && body?.status !== null && body?.status !== '') {
      if (body.status === 'completed') isCompleteBool = true;
      if (body.status === 'booked') isCompleteBool = false;
    }

    // Handle centerGroupIds as array (can be string, string[], or comma-separated string)
    let centerGroupIdsArray: number[] | undefined;
    if (body?.centerGroupIds !== undefined && body?.centerGroupIds !== null && body?.centerGroupIds !== '') {
      if (Array.isArray(body.centerGroupIds)) {
        centerGroupIdsArray = body.centerGroupIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id));
      } else if (typeof body.centerGroupIds === 'string') {
        centerGroupIdsArray = body.centerGroupIds
          .split(',')
          .map((id: string) => parseInt(id.trim(), 10))
          .filter((id: number) => !isNaN(id));
      } else if (typeof body.centerGroupIds === 'number') {
        centerGroupIdsArray = [body.centerGroupIds];
      }
    }

    return this.consultationService.getAllConsultationsPaginated(
      pageNumber,
      limitNumber,
      centerIdsArray,
      daysBackNumber,
      centerGroupIdsArray,
      isCompleteBool,
      body?.startDate,
      body?.endDate,
      body?.doctorName
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
