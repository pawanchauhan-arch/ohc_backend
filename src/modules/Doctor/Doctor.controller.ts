import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    Delete,
    Query,
  } from '@nestjs/common';
  import { DoctorService } from './Doctor.service';
  import { Doctor } from '../../models/Doctor';
  import { Consultation } from 'src/models/Consultation';
  
  @Controller('api/doctors')
  export class DoctorController {
    constructor(private readonly doctorService: DoctorService) {}
    /**
     * Get doctor by phone number using query parameter
     */
    @Get('getDoctorData')
    async getDoctorByPhoneNumber(
      @Query('phoneNumber') phoneNumber: string,
    ): Promise<Doctor & { name?: string }> {
      console.log('Received phone number:', phoneNumber);
      console.log('Type of phone number:', typeof phoneNumber);
  
      // Call the service method
      return this.doctorService.getDoctorByPhoneNumber(phoneNumber);
    }
  }