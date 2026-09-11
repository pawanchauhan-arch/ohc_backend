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
import { AmbulancesService } from './ambulance.service';
import { AmbulanceFilterDto } from './dto/ambulance-filter.dto';
import { CreateAmbulanceDto } from './dto/create-ambulance.dto';
import { UpdateAmbulanceDto } from './dto/update-ambulance.dto';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ambulances')
export class AmbulancesController {
  constructor(private readonly ambulancesService: AmbulancesService) {}

  @Post()
  create(
    @Body() dto: CreateAmbulanceDto,
    @Req() req: any,
  ) {
    return this.ambulancesService.create(dto, req.user);
  }

  @Get()
  findAll(
    @Query() filters: AmbulanceFilterDto,
    @Req() req: any,
  ) {
    return this.ambulancesService.findAll(req.user, filters);
  }

  @Get('search')
  search(
    @Query('q') query: string,
    @Req() req: any,
  ) {
    return this.ambulancesService.search(req.user, query);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.ambulancesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAmbulanceDto,
    @Req() req: any,
  ) {
    return this.ambulancesService.update(id, dto, req.user);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    return this.ambulancesService.remove(id, req.user);
  }
}
