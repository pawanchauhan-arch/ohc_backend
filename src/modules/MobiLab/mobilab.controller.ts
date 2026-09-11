// controllers/mobilab.controller.ts
import { 
    Controller, 
    Get, 
    Post, 
    Body, 
    Put, 
    Param, 
    UsePipes, 
    ValidationPipe, 
    HttpCode, 
    HttpStatus,
    HttpException,
    Query
  } from '@nestjs/common';
  import { MobilabService } from './mobilab.service';
  import { 
    BookTestDto, 
    CreateMobileUserDto, 
    CreateMobileUserRequestDto,
    UpdateMobileUserDto,
    UpdateMobileUserRequestDto,
    TestItemDto
  } from './mobilab.dto';
  
  @Controller('api/mobilab')
  export class MobilabController {
    constructor(private readonly mobilabService: MobilabService) {}
  
    // --- 1. General Vendor Data Endpoints ---
  
    @Get('tests')
    async getAvailableTests() {
      return await this.mobilabService.getAvailableTests();
    }
  
    @Get('profiles')
    async getAvailableProfiles() {
      return await this.mobilabService.getAvailableProfiles();
    }
  
    @Get('devices')
    async getRegisteredDevices() {
      return await this.mobilabService.getRegisteredDevices();
    }
  
    // --- 2. Manual Mobile User Management (Optional/Admin) ---
    // These remain if you need to manually create users for testing, 
    // but the system now handles Center creation automatically during booking.
  
    @Get('users')
    async getMobileUsers() {
      return await this.mobilabService.getMobileUsers();
    }
  
    @Post('users')
    @UsePipes(new ValidationPipe({ transform: true }))
    async createMobileUser(@Body() body: CreateMobileUserRequestDto) {
      const centerIds = body.center_ids?.length
        ? body.center_ids
        : body.center_id != null
          ? [body.center_id]
          : [];

      if (centerIds.length === 0) {
        throw new HttpException('Either center_id or center_ids must be provided', HttpStatus.BAD_REQUEST);
      }

      const { center_id, center_ids, ...createUserDto } = body;
      return await this.mobilabService.getOrCreateCenterMobilabUser(centerIds, createUserDto);
    }
  
    @Put('users')
    @UsePipes(new ValidationPipe({ transform: true }))
    async updateMobileUser(@Body() body: UpdateMobileUserRequestDto) {
      const centerIds = body.center_ids?.length
        ? body.center_ids
        : body.center_id != null
          ? [body.center_id]
          : [];

      if (centerIds.length === 0) {
        throw new HttpException('Either center_id or center_ids must be provided', HttpStatus.BAD_REQUEST);
      }

      const { center_id, center_ids, ...updateDto } = body;
      return await this.mobilabService.updateMobileUser(updateDto, centerIds);
    }
  
    // --- 4. Main LMC Booking Logic (Driver + Center) ---

    @Get('users')
    async getMobileUser(center_id: number) {
      return await this.mobilabService.getCenterCredentials(center_id);
    }
  
    /**
     * Main Endpoint to book a test for a specific Driver & Checkup.
     * Automatically handles Center login/creation.
     */
    @Post('book-driver')
    @HttpCode(HttpStatus.CREATED)
    async bookTestForDriver(
      @Body() dto: { 
        driver_id: number; 
        health_checkup_id: number; 
        tests?: TestItemDto[]; 
      }
    ) {
      return await this.mobilabService.bookTestForDriver(
        dto.driver_id, 
        dto.health_checkup_id, 
        dto.tests
      );
    }
  
    // --- 5. Result Handling ---
  
    /**
     * Fetch result from Vendor API and save to our DB.
     * Often called via Webhook or Poll.
     */
    @Get('fetch-vendor-results/:bookingID')
    async fetchAndSaveVendorResults(@Param('bookingID') bookingID: string) {
      return await this.mobilabService.getAndSaveTestResults(bookingID);
    }
  
    /**
     * Get stored results from our DB for a specific Driver/Checkup
     */
    @Post('get-stored-results')
    @HttpCode(HttpStatus.OK)
    async getStoredResults(@Body() dto: { driver_id: number; health_checkup_id: number }) {
      return await this.mobilabService.getResults(dto.driver_id, dto.health_checkup_id);
    }
    
  
    /**
     * Retrieve the Vendor Booking ID for reference
     */
    @Post('get-booking-id')
    @HttpCode(HttpStatus.OK)
    async getBookingId(@Body() dto: { driver_id: number; health_checkup_id: number }) {
      return await this.mobilabService.getBookingId(dto.driver_id, dto.health_checkup_id);
    }
  
    // --- 6. Utility ---
  
    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout() {
      return await this.mobilabService.logout();
    }
}