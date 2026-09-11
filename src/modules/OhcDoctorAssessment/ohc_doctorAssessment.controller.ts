import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req
} from '@nestjs/common';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { OhcDoctorAssessmentService } from './ohc_doctorAssessment.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-doctor-assessment')
export class OhcDoctorAssessmentController {
  constructor(private readonly service: OhcDoctorAssessmentService) {}

   @Post()
     create(@Body() body: any, @Req() req: any) {
       return this.service.create(body, req);
     }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('patient/:id')
  findByPatient(@Param('id') id: number) {
    return this.service.findByPatient(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.softDelete(Number(id));
  }
  @Get(':id')
findOne(@Param('id') id: number) {
  return this.service.findOne(Number(id));
}
}