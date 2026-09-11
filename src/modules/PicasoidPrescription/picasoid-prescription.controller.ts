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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Delete,
} from '@nestjs/common';
import { PicasoidPrescriptionService } from './picasoid-prescription.service';
import { Response, Request } from 'express';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GlobalHelper } from 'src/helper/global.helper';
@UseGuards(JwtAdminGuardB2C)
@Controller('api/picasoid-prescription')
export class PicasoidPrescriptionController {
  constructor(private readonly service: PicasoidPrescriptionService) {}

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
  

  @Post('upload/lab-report')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/lab-reports',

        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  uploadLabReport(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return {
      path: `/uploads/lab-reports/${file.filename}`,
    };
  }
  @Post('upload/radiology-report')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/radiology',

        filename: (req, file, cb) => {
          const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9);

          cb(null, uniqueName + extname(file.originalname));
        },
      }),
    }),
  )
  uploadRadiologyReport(
    @UploadedFile()
    file: Express.Multer.File,
  ) {
    return {
      path: `/uploads/radiology/${file.filename}`,
    };
  }
  @Post('/save-ohc-combined')
  saveOhcCombined(
    @Body() body: any,

    @Req() req: Request,
  ) {
    return this.service.saveOhcCombined(body, req);
  }
  // @Get('/ohc-combined')

  // getOhcCombinedList() {

  //   return this.service.getOhcCombinedList();
  // }
  @Get('/ohc-combined')
  getOhcCombinedList(
    @Query('page')
    page = 1,

    @Query('limit')
    limit = 10,
  ) {
    return this.service.getOhcCombinedList(Number(page), Number(limit));
  }

  @Get('/ohc-combined/:id')
  getOhcCombinedById(
    @Param('id')
    id: number,
  ) {
    return this.service.getOhcCombinedById(id);
  }
  @Put('/ohc-combined/:id')
  updateOhcCombined(
    @Param('id') id: number,
    @Body() body: any,
    @Req() req: Request,
  ) {
    return this.service.updateOhcCombined(Number(id), body, req);
  }

  @Delete('/ohc-combined/:id')
  softDeleteOhcCombined(@Param('id') id: number) {
    return this.service.softDeleteOhcCombined(Number(id));
  }
}
