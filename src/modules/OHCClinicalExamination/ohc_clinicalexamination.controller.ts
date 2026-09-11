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
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { OhcClinicalExaminationService } from './ohc_clinicalexamination.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-clinical-examination')
export class OhcClinicalExaminationController {
  constructor(private readonly service: OhcClinicalExaminationService) {}

 
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
findById(@Param('id') id: number) {
  return this.service.findById(Number(id));
}
}