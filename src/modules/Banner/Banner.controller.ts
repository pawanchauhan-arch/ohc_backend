import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { BannersService } from './Banner.service';
import { Banner } from '../../models/Banner';
import { BannerDto } from '../Banner/Banner.dto'; // Import the DTO
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('api/banners')
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  // @Post('create')
  // async createBanner(@Body() data: Partial<Banner>): Promise<Banner> {
  //   return this.bannersService.createBanner(data);
  // }

  @Post('create')
  @UseInterceptors(FileInterceptor('image')) // The 'image' field in the form data
  async createBanner(
    @Body() data: Partial<Banner>,
    @UploadedFile() imageFile: Express.Multer.File, // Get the uploaded file
  ): Promise<Banner> {
    return this.bannersService.createBanner(data, imageFile);
  }

  @Post('create2')
  @UseInterceptors(FileInterceptor('image')) // The 'image' field in the form data
  async createBanner2(
    @Body() data: Partial<Banner>,
    @UploadedFile() imageFile: Express.Multer.File, // Get the uploaded file
  ): Promise<Banner> {
    return this.bannersService.createBanner(data, imageFile);
  }

  @Get()
  async getAllBanners(): Promise<Banner[]> {
    return this.bannersService.getAllBanners();
  }

  @Get(':id')
  async getBannerById(@Param('id') banner_id: number): Promise<Banner> {
    return this.bannersService.getBannerById(banner_id);
  }

  @Put(':id')
  async updateBanner(
    @Param('id') banner_id: number,
    @Body() data: Partial<Banner>,
  ): Promise<Banner> {
    return this.bannersService.updateBanner(banner_id, data);
  }

  @Delete(':id')
  async deleteBanner(@Param('id') banner_id: number): Promise<void> {
    return this.bannersService.deleteBanner(banner_id);
  }

  // New POST API for filtering banners based on the provided attributes
  @Post('filterBanners')
  async filterBanners(@Body() filterOptions: BannerDto): Promise<Banner[]> {
    return this.bannersService.filterBanners(filterOptions);
  }

  @Post("upload-to-s3")
  @UseInterceptors(FileInterceptor("file"))
  async uploadBannerImage(@UploadedFile() file: Express.Multer.File) {
    return this.bannersService.uploadBannerImage(file);
  }
  
}
