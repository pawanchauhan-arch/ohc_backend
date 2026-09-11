import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';

import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';

import { FileFieldsInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { OrganizationProfileService } from './organization-profile.service';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/organization-profile')
export class OrganizationProfileController {
  constructor(
    private readonly organizationProfileService: OrganizationProfileService,
  ) {}

  // ================= CREATE =================
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'secondary_logo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/organization-profile',

          filename: (req, file, cb) => {
            const uniqueName =
              Date.now() + '-' + Math.round(Math.random() * 1e9);

            cb(null, uniqueName + extname(file.originalname));
          },
        }),

        limits: {
          fileSize: 5 * 1024 * 1024,
        },

        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Only image files allowed'), false);
          }
        },
      },
    ),
  )
  async create(
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      secondary_logo?: Express.Multer.File[];
    },

    @Body() body: any,
  ) {
    // save file path into body
    if (files?.logo?.[0]) {
      body.logo = `/uploads/organization-profile/${files.logo[0].filename}`;
    }

    if (files?.secondary_logo?.[0]) {
      body.secondary_logo = `/uploads/organization-profile/${files.secondary_logo[0].filename}`;
    }

    return await this.organizationProfileService.create(body);
  }
  @Get()
  async findAll(@Query() query: any) {
    return this.organizationProfileService.findAll(query);
  }
  // ================= UPDATE =================
  @Put(':id')
  @UseInterceptors(
    FileFieldsInterceptor(
      [
        { name: 'logo', maxCount: 1 },
        { name: 'secondary_logo', maxCount: 1 },
      ],
      {
        storage: diskStorage({
          destination: './uploads/organization-profile',

          filename: (req, file, cb) => {
            const uniqueName =
              Date.now() + '-' + Math.round(Math.random() * 1e9);

            cb(null, uniqueName + extname(file.originalname));
          },
        }),

        limits: {
          fileSize: 5 * 1024 * 1024,
        },

        fileFilter: (req, file, cb) => {
          if (file.mimetype.startsWith('image/')) {
            cb(null, true);
          } else {
            cb(new BadRequestException('Only image files allowed'), false);
          }
        },
      },
    ),
  )
  async update(
    @Param('id') id: number,

    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      secondary_logo?: Express.Multer.File[];
    },

    @Body() body: any,
  ) {
    if (files?.logo?.[0]) {
      body.logo = `/uploads/organization-profile/${files.logo[0].filename}`;
    }

    if (files?.secondary_logo?.[0]) {
      body.secondary_logo = `/uploads/organization-profile/${files.secondary_logo[0].filename}`;
    }

    return await this.organizationProfileService.update(Number(id), body);
  }

  // ================= BRANDING =================
  @Get('branding')
  async getBranding(
    @Query('tenant_id') tenantId: number,
    @Query('center_id') centerId?: number,
  ) {
    return await this.organizationProfileService.getBranding(
      tenantId,
      centerId,
    );
  }
}
