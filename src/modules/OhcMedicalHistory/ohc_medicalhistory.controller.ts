import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req
} from '@nestjs/common';
import { OhcMedicalHistoryService } from './ohc_medicalhistory.service';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-medical-history')
export class OhcMedicalHistoryController {
  constructor(private readonly service: OhcMedicalHistoryService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.service.create(body, req);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findByPatient(@Param('id') id: number) {
    return this.service.findByPatient(Number(id));
  }
  @Get('edit/:id')
findById(@Param('id') id: number) {
  return this.service.findById(Number(id));
}

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.softDelete(Number(id));
  }
}