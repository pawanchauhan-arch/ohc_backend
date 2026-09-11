import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Req
} from '@nestjs/common';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OhcRadiologyService } from './ohc_radiology.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-radiology')
export class OhcRadiologyController {
  constructor(private readonly service: OhcRadiologyService) {}

  // Upload report
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/radiology',
        filename: (req, file, cb) => {
          const name =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, name + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, cb) => {
        if (
          file.mimetype === 'application/pdf' ||
          file.mimetype.startsWith('image/')
        ) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Only PDF/Image allowed'), false);
        }
      },
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  upload(@UploadedFile() file: Express.Multer.File) {
    return {
      path: `/uploads/radiology/${file.filename}`,
    };
  }

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
update(@Param('id') id: number, @Body() body: any, @Req() req: any) {
  return this.service.update(Number(id), body, req);
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