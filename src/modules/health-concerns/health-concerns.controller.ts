import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  Query, 
  HttpCode, 
  HttpStatus,
  ParseIntPipe 
} from '@nestjs/common';
import { HealthConcernsService } from './health-concerns.service';
import { CreateConcernDto } from './dto/create-concern.dto';
import { UpdateConcernDto } from './dto/update-concern.dto';
import { ConcernFiltersDto } from './dto/concern-filters.dto';
import { HealthConcern } from '../../models/HealthConcern';

@Controller('api/health-concerns')
export class HealthConcernsController {
  constructor(private readonly healthConcernsService: HealthConcernsService) {}

  /**
   * Get all health concerns with filters and pagination
   */
  @Get()
  async getConcerns(@Query() filters: ConcernFiltersDto) {
    return this.healthConcernsService.getConcerns(filters);
  }

  /**
   * Get a health concern by ID
   */
  @Get(':id')
  async getConcernById(@Param('id', ParseIntPipe) id: number): Promise<HealthConcern> {
    return this.healthConcernsService.getConcernById(id);
  }

  /**
   * Create a new health concern
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createConcern(@Body() createConcernDto: CreateConcernDto): Promise<HealthConcern> {
    return this.healthConcernsService.createConcern(createConcernDto);
  }

  /**
   * Update a health concern
   */
  @Put(':id')
  async updateConcern(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateConcernDto: UpdateConcernDto,
  ): Promise<HealthConcern> {
    return this.healthConcernsService.updateConcern(id, updateConcernDto);
  }

  /**
   * Delete a health concern
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConcern(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.healthConcernsService.deleteConcern(id);
  }

  /**
   * Get concerns by health checkup ID
   */
  @Get('health-checkup/:healthCheckupId')
  async getConcernsByHealthCheckupId(
    @Param('healthCheckupId', ParseIntPipe) healthCheckupId: number,
  ): Promise<HealthConcern[]> {
    return this.healthConcernsService.getConcernsByHealthCheckupId(healthCheckupId);
  }

  /**
   * Get pending concerns
   */
  @Get('pending/list')
  async getPendingConcerns(): Promise<HealthConcern[]> {
    return this.healthConcernsService.getPendingConcerns();
  }
}
