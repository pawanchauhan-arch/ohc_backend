import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
} from '@nestjs/common';
import { OhcVitalsService } from './ohc-vitals.service';

@Controller('api/ohc-vitals')
export class OhcVitalsController {
    constructor(private readonly service: OhcVitalsService) {}

    @Post()
    create(@Body() body: any) {
        return this.service.create(body)
    }
    @Get()
  async findAll() {
    return await this.service.findAll();
  }
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.service.findOne(Number(id));
  }
   @Put(':id')
  async update(@Param('id') id: string, @Body() body: any) {
    return await this.service.update(Number(id), body);
  }
   @Delete(':id')
  async delete(@Param('id') id: string) {
    return await this.service.delete(Number(id));
  }

}
