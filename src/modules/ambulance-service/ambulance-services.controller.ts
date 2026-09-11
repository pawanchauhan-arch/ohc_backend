import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AmbulanceServicesService } from './ambulance-services.service';
import { AmbulanceServiceFilterDto } from './dto/ambulance-service-filter.dto';
import { CreateAmbulanceServiceDto } from './dto/create-ambulance-service.dto';
import { UpdateAmbulanceServiceDto } from './dto/update-ambulance-service.dto';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ambulance-services')
export class AmbulanceServicesController {
  constructor(
    private readonly ambulanceServicesService: AmbulanceServicesService,
  ) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateAmbulanceServiceDto) {
    return this.ambulanceServicesService.create(dto, req.user);
  }

  @Get()
  findAll(@Query() filters: AmbulanceServiceFilterDto, @Req() req: any) {
    return this.ambulanceServicesService.findAll(req.user, filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.ambulanceServicesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAmbulanceServiceDto,
    @Req() req: any,
  ) {
    return this.ambulanceServicesService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.ambulanceServicesService.remove(id, req.user);
  }
}
