import { 
  Controller, 
  Get, 
  Param, 
  ParseIntPipe, 
  HttpCode, 
  HttpStatus 
} from '@nestjs/common';
import { SpocManagementService } from './spoc-management.service';
import { SpocDetailsDto, CetSpocDto, ClientSpocDto } from './dto/spoc-details.dto';

@Controller('api/spoc-management')
export class SpocManagementController {
  constructor(private readonly spocManagementService: SpocManagementService) {}

  /**
   * Get SPOC details for both CET and Client
   */
  @Get(':cetId/:centerId')
  @HttpCode(HttpStatus.OK)
  async getSpocDetails(
    @Param('cetId', ParseIntPipe) cetId: number,
    @Param('centerId', ParseIntPipe) centerId: number,
  ): Promise<SpocDetailsDto> {
    return this.spocManagementService.getSpocDetails(cetId, centerId);
  }

  /**
   * Get CET SPOC details
   */
  @Get('cet/:cetId')
  @HttpCode(HttpStatus.OK)
  async getCetSpocDetails(
    @Param('cetId', ParseIntPipe) cetId: number,
  ): Promise<CetSpocDto> {
    return this.spocManagementService.getCetSpocDetails(cetId);
  }

  /**
   * Get Client SPOC details
   */
  @Get('client/:centerId')
  @HttpCode(HttpStatus.OK)
  async getClientSpocDetails(
    @Param('centerId', ParseIntPipe) centerId: number,
  ): Promise<ClientSpocDto> {
    return this.spocManagementService.getClientSpocDetails(centerId);
  }

  /**
   * Validate SPOC contact information
   */
  @Get('validate/:cetId/:centerId')
  @HttpCode(HttpStatus.OK)
  async validateSpocContacts(
    @Param('cetId', ParseIntPipe) cetId: number,
    @Param('centerId', ParseIntPipe) centerId: number,
  ) {
    return this.spocManagementService.validateSpocContacts(cetId, centerId);
  }
}
