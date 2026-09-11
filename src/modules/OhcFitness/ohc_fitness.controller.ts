import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Param,
  Put,
  Delete,
  Req,
  NotFoundException,
  Res,
} from '@nestjs/common';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { OhcFitnessService } from './ohc_fitness.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-fitness')
export class OhcFitnessController {
  constructor(private readonly service: OhcFitnessService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    return this.service.createCertificate({ ...body, created_by: req.user.id });
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Post('templates')
  createTemplate(@Body() body: any) {
    return this.service.createTemplate(body);
  }
  @Get('templates')
  findAllTemplates() {
    return this.service.findTemplates();
  }
  @Post('preview-template')
  async previewTemplate(@Body() body: any) {
    return this.service.previewTemplate(body);
  }

  @Get('templates/:tenant_id')
  get(@Param('tenant_id') tenant_id: number) {
    return this.service.findTemplates(tenant_id);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() body: any, @Req() req: any) {
    return this.service.update(Number(id), body);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.softDelete(Number(id));
  }
  @Put('templates/:id')
updateTemplate(@Param('id') id: number, @Body() body: any) {
  return this.service.updateTemplate(Number(id), body);
}
}
