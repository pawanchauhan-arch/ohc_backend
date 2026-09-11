import { 
  Body, 
  Controller, 
  Post, 
  BadRequestException,
  UseInterceptors,
  UploadedFile
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CamplistitemService } from './camplistitem.service';
import { BarcodeUploadDto } from './dto/barcode-upload.dto';

/**
 * Controller for managing camp list items
 */
@Controller('api/camp-list-items')
export class CamplistitemController {
  constructor(private readonly camplistitemService: CamplistitemService) {}

  @Post('delete-camplistItem')
  async deleteCamplistItem(
    @Body('camplistItemId') camplistItemId: number,
  ) {
    return this.camplistitemService.deletecamplistItem(camplistItemId);
  }

  @Post('delete-camplist')
  async deleteCamplist(
    @Body('camplistId') camplistId: number,
  ) {
    return this.camplistitemService.deletecamplist(camplistId);
  }



  /**
   * Upload driver ID proof image and update camp list items
   * POST /api/camp-list-items/upload-id-proof
   * 
   */
  @Post('upload-id-proof')
  @UseInterceptors(FileInterceptor('image'))
  async uploadDriverIdProof(
    @Body('camp_list_item_id') campListItemId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!campListItemId) {
      throw new BadRequestException('Camp list item ID is required');
    }

    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const campListItemIdNum = Number(campListItemId);
    if (isNaN(campListItemIdNum) || campListItemIdNum <= 0) {
      throw new BadRequestException('Valid camp list item ID is required');
    }

    return this.camplistitemService.uploadDriverIdProof(campListItemIdNum, file);
  }

  /**
   * Upload barcode image for a camp list item
   * POST /api/camp-list-items/upload-barcode
   */
  @Post('upload-barcode')
  @UseInterceptors(FileInterceptor('barcode_image'))
  async uploadBarcode(
    @Body() barcodeData: BarcodeUploadDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Barcode image file is required');
    }

    if (!barcodeData.camp_list_item_id) {
      throw new BadRequestException('Camp list item ID is required');
    }

    if (!barcodeData.barcode_number) {
      throw new BadRequestException('Barcode number is required');
    }

    if (!barcodeData.barcode_name) {
      throw new BadRequestException('Barcode name (test name) is required');
    }

    return this.camplistitemService.uploadBarcode(barcodeData, file);
  }


  @Post('updateTrfNumber')
  async updateTrfNumber(@Body() dto: { id: number, trf_number: string }) {
    return this.camplistitemService.updateTrfNumber(dto.id, dto.trf_number);
  }
}
