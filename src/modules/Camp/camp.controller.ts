import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors, Query, BadRequestException } from '@nestjs/common';
import { CampService } from './camp.service';
import { AddCampItemDto, CreateCampDto, UpdateCampDto, UpdateCampItemDto, CreateBarcodeDto } from './camp.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateCustomerCampDto } from '../Samplify/samplify.dto';

@Controller('api/camps')
export class CampController {
  constructor(private readonly campService: CampService) {}

  /**
   * Validates and converts center_id parameter
   */
  private validateCenterId(center_id: string | number): number {
    const centerId = Number(center_id);
    if (isNaN(centerId) || centerId <= 0) {
      throw new BadRequestException('Valid center_id is required');
    }
    return centerId;
  }

  @Post()
  async createCamp(@Body() dto: CreateCustomerCampDto, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    return this.campService.createCamp(dto, centerId);
  }

  @Get()
  async listCamps(@Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    return this.campService.listCamps(centerId);
  }

  @Get(':campId')
  async getCamp(@Param('campId') campId: string, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    return this.campService.getCamp(Number(campId), centerId);
  }

  @Patch(':campId')
  async updateCamp(@Param('campId') campId: string, @Body() dto: CreateCustomerCampDto, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    return this.campService.updateCamp(Number(campId), centerId, dto);
  }

  @Post(':campId/items')
  async addItem(@Param('campId') campId: string, @Body() dto: AddCampItemDto) {
    const centerId = this.validateCenterId(dto.center_id);       //edfvgb  
    return this.campService.addItem(Number(campId), centerId, dto);
  }

  @Patch('items/:itemId')
  async updateItem(@Param('itemId') itemId: string, @Body() dto: UpdateCampItemDto) {
    const centerId = this.validateCenterId(dto.center_id);      //edfvgb  
    return this.campService.updateItem(Number(itemId), centerId, dto);
  }

  @Delete('items/:itemId')
  async removeItem(@Param('itemId') itemId: string, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);   //edfvgb  
    await this.campService.removeItem(Number(itemId), centerId);
    return { success: true };
  }

  @Post('items/:itemId/barcodes')
  async createBarcode(@Param('itemId') itemId: string, @Body() dto: CreateBarcodeDto) {
    const centerId = this.validateCenterId(dto.center_id);      //edfvgb  
    return this.campService.createBarcode(Number(itemId), centerId, dto);
  }

  @Get('items/:itemId/barcodes')
  async listBarcodes(@Param('itemId') itemId: string, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);   //edfvgb  
    return this.campService.listBarcodes(Number(itemId), centerId);
  }

  @Delete('items/:itemId/barcodes/:barcodeId')
  async deleteBarcode(@Param('itemId') itemId: string, @Param('barcodeId') barcodeId: string, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);   //edfvgb  
    await this.campService.deleteBarcode(Number(itemId), Number(barcodeId), centerId);
    return { success: true };
  }

  @Post(':campId/items/import-csv')
  @UseInterceptors(FileInterceptor('file'))
  async importCampItemsCsv(@Param('campId') campId: string, @UploadedFile() file: Express.Multer.File, @Query('center_id') center_id: string) {
    const centerId = this.validateCenterId(center_id);
    return this.campService.importCampItemsCsv(Number(campId), centerId, file);
  }

  @Post(':campId/items/batch-upload')
  async batchUploadCampPatients(
    @Param('campId') campId: string,
    @Body() body: { patients: any[] },
    @Query('center_id') center_id: string,
  ) {
    const centerId = this.validateCenterId(center_id);
    return this.campService.uploadCampPatientsBatch(Number(campId), centerId, body?.patients || []);
  }

  @Post('uploadPatients')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPatientsCsv(@UploadedFile() file: Express.Multer.File) {
    return this.campService.uploadPatientsCsv( file);
  }
}
