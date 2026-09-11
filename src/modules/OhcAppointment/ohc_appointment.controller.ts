import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { OhcAppointmentService } from './ohc_appointment.service';

@Controller('api/ohc-appointments')
export class OhcAppointmentController {
  constructor(private readonly service: OhcAppointmentService) {}

  @Post()
  create(@Body() body: any) {
    return this.service.create(body);
  }

 
  @Get()
  findAll() {
    return this.service.findAll();
  }

  
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(Number(id));
  }


  @Put(':id')
  update(@Param('id') id: number, @Body() body: any) {
    return this.service.update(Number(id), body);
  }

 
  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(Number(id));
  }
}