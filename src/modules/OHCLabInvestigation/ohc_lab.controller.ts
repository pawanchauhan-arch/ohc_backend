import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Put,
  Delete,
  Req
} from '@nestjs/common';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { OhcLabService } from './ohc_lab.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/ohc-labs')
export class OhcLabController {
  constructor(private readonly service: OhcLabService) {}

  // ✅ Upload file
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/lab-reports',
        filename: (req, file, cb) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueName + extname(file.originalname));
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
    }),
  )
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      path: `/uploads/lab-reports/${file.filename}`,
    };
  }

  // ✅ Create investigation with tests (IMPORTANT)
  @Post()
  create(@Body() body: any,  @Req() req: any) {
    return this.service.createInvestigation(body, req);
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
  return this.service.updateInvestigation(Number(id), body, req);
}

@Delete(':id')
delete(@Param('id') id: number) {
  return this.service.deleteInvestigation(Number(id));
}

@Get(':id')
findOne(@Param('id') id: number) {
  return this.service.findOne(Number(id));
}
}