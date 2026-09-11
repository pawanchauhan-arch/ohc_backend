import {
  Controller,
  Get,
  Query,
  Put,
  Patch,
  Param,
  Body,
  Post,
  ParseIntPipe,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PicasoidCampPrescriptionService } from './picasoid-prescription-camp.service';
import { Response, Request } from 'express';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { GlobalHelper } from 'src/helper/global.helper';
@UseGuards(JwtAdminGuardB2C)
@Controller('api/picasoid-prescription-camp')
export class PicasoidPrescriptionCampController {
  constructor(private readonly service: PicasoidCampPrescriptionService) {}

  @Get()
  getPrescriptionList(@Req() req: Request, @Query() Query: any) {
    return this.service.getPrescriptionList(req['user'], Query);
  }

  @Post('create')
  async savePrescription(@Req() req: Request, @Body() body: any) {
    return this.service.savePrescription(req['user'], body);
  }
  @Get('export/excel')
  async exportExcel(
    @Req() req: Request,
    @Query() query: any,
    @Res() res: Response,
  ) {
    const buffer = await this.service.exportPrescriptionExcel(
      req['user'],
      query,
    );

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="prescriptions.xlsx"',
    );

    res.end(buffer);
  }

  @Put(':id')
  async update(
    @Req() req: Request,
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.service.savePrescription(req['user'], {
      ...body,
      ID: id,
    });
  }
  @Patch(':id/toggle-status')
  async toggleStatus(@Req() req: Request, @Param('id', ParseIntPipe) id: number) {
    const result = this.service.toggleStatus(id);
     const userv = req['user'];
    await GlobalHelper.createUserLogs({
      user_id: userv.id,
      action_type: 'delete_Prescription',
      action_description: `Delete Prescription Bill ID: ${id}`,
      user_ip: req.ip,
      action_time: new Date(),
    });
    return result;
  }
}
