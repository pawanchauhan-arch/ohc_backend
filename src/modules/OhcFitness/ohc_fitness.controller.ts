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
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { OhcFitnessService } from './ohc_fitness.service';
import { CreateFitnessCertificateDto } from './dto/create-fitness-certificate.dto';
import { UpdateFitnessCertificateDto } from './dto/update-fitness-certificate.dto';
import { PreviewFitnessCertificateDto } from './dto/preview-fitness-certificate.dto';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-fitness')
export class OhcFitnessController {
  constructor(private readonly service: OhcFitnessService) {}

  @Post()
  create(@Body() body: CreateFitnessCertificateDto, @Req() req: any) {
    return this.service.createCertificate({
      ...body,
      created_by: req.user.id,
      tenant_id: req.user.tenantId,
      center_id: req.user.centerId,
    });
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
  @Get('count')
  fitnessCertificateCount(@Req() req: any) {
    return this.service.fitnessCertificateCount(req.user);
  }

  @Post('preview-certificate')
  previewCertificate(
    @Body() body: PreviewFitnessCertificateDto,
    @Req() req: any,
  ) {
    return this.service.previewCertificate({
      ...body,
      tenant_id: req.user.tenantId,
      center_id: req.user.centerId,
    });
  }

  @Post('preview-certificate-pdf')
  async previewCertificatePdf(
    @Body() body: PreviewFitnessCertificateDto,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const buffer = await this.service.previewCertificatePdf({
      ...body,
      tenant_id: req.user.tenantId,
      center_id: req.user.centerId,
    });

    const fileName = body.certificate_number
      ? `Fitness-Certificate-${body.certificate_number}.pdf`
      : 'Fitness-Certificate-Preview.pdf';

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
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
  previewTemplate(@Body() body: any, @Req() req: any) {
    return this.service.previewCertificate({
      ...body,
      tenant_id: req.user.tenantId,
      center_id: req.user.centerId,
    });
  }

  @Get('templates/:tenant_id')
  get(@Param('tenant_id') tenant_id: number) {
    return this.service.findTemplates(tenant_id);
  }

  @Put('templates/:id')
  updateTemplate(@Param('id') id: number, @Body() body: any) {
    return this.service.updateTemplate(Number(id), body);
  }

  @Get(':id/pdf')
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, fileName } = await this.service.downloadCertificatePdf(
      Number(id),
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(Number(id));
  }

  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() body: UpdateFitnessCertificateDto,
    @Req() req: any,
  ) {
    return this.service.update(Number(id), {
      ...body,
      updated_by: req.user.id,
      tenant_id: req.user.tenantId,
      center_id: req.user.centerId,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.softDelete(Number(id));
  }
}
