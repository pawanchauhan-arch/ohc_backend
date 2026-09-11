import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CampListItem } from '../../models/CampListItem';
import { CampList } from '../../models/CampList';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CampItemBarcode } from '../../models/CampItemBarcode';
import { uploadToS3, uploadToS3WithFolder } from '../../utils/s3-image-upload';
import { BUCKET_NAME_PATIENT_ID_PROOF } from '../../../config/envConfig';
import { BarcodeUploadDto, BarcodeUploadResponseDto } from './dto/barcode-upload.dto';

/**
 * Service for managing camp list items
 */
@Injectable()
export class CamplistitemService {
  constructor(
    @InjectModel(CampListItem) private readonly campListItemModel: typeof CampListItem,
    @InjectModel(CampList) private readonly campListModel: typeof CampList,
    @InjectModel(DRIVERMASTER) private readonly driverModel: typeof DRIVERMASTER,
    @InjectModel(CampItemBarcode) private readonly campItemBarcodeModel: typeof CampItemBarcode,
  ) {}

  /**
   * Upload driver ID proof image and update camp list items
   */
  async uploadDriverIdProof(campListItemId: number, file: Express.Multer.File): Promise<{
    success: boolean;
    message: string;
    data: {
      camp_list_item_id: number;
      driver_id: number;
      camp_id: number;
      image_url: string;
      updated_items: number;
    };
  }> {
    console.log('Service - Camp List Item ID:', campListItemId);
    console.log('Service - File:', file.originalname, file.mimetype);

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.');
    }

    // Find the camp list item and include driver information
    const campItem = await this.campListItemModel.findByPk(campListItemId, {
      include: [
        {
          model: DRIVERMASTER,
          as: 'driver',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!campItem) {
      throw new NotFoundException(`Camp list item with ID ${campListItemId} not found`);
    }

    console.log('Found camp item for driver:', campItem.driver.name);

    // Create folder path: user{driver_id}/idproof
    const folderPath = `user${campItem.driver_id}/idproof`;

    // Upload image to S3 with folder structure
    let imageUrl: string;
    try {
      imageUrl = await uploadToS3WithFolder(file, BUCKET_NAME_PATIENT_ID_PROOF, folderPath);
      console.log('Image uploaded to S3:', imageUrl);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException('Failed to upload image to S3: ' + error.message);
    }

    // Update the camp item with the S3 URL
    try {
      await campItem.update({ id_proof_image: imageUrl });
      console.log('Updated camp item with image URL');
    } catch (error) {
      console.error('Database update error:', error);
      throw new BadRequestException('Failed to update camp item with image URL');
    }

    return {
      success: true,
      message: 'ID proof image uploaded and updated successfully',
      data: {
        camp_list_item_id: campListItemId,
        driver_id: campItem.driver_id,
        camp_id: campItem.camp_id,
        image_url: imageUrl,
        updated_items: 1,
      },
    };
  }

  /**
   * Upload barcode image for a camp list item
   */
  async uploadBarcode(
    barcodeData: BarcodeUploadDto,
    file: Express.Multer.File,
  ): Promise<BarcodeUploadResponseDto> {

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only image files (JPEG, PNG, GIF, WebP) are allowed.');
    }

    // Validate camp list item ID
    const campListItemId = Number(barcodeData.camp_list_item_id);
    if (isNaN(campListItemId) || campListItemId <= 0) {
      throw new BadRequestException('Valid camp list item ID is required');
    }

    // Check if camp list item exists and get driver information
    const campListItem = await this.campListItemModel.findByPk(campListItemId, {
      include: [
        {
          model: DRIVERMASTER,
          as: 'driver',
          attributes: ['id', 'name'],
        },
      ],
    });

    if (!campListItem) {
      throw new NotFoundException(`Camp list item with ID ${campListItemId} not found`);
    }

    console.log('Found camp list item for driver:', campListItem.driver.name);

    // Create folder path: user{driver_id}/barcode
    const folderPath = `user${campListItem.driver_id}/barcode`;

    // Upload image to S3 with folder structure
    let imageUrl: string;
    try {
      imageUrl = await uploadToS3WithFolder(file, BUCKET_NAME_PATIENT_ID_PROOF, folderPath);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException('Failed to upload barcode image to S3: ' + error.message);
    }
console.log('Barcode name:   ', barcodeData.barcode_name);
    // Create barcode record in database
    let barcodeRecord: CampItemBarcode;
    try {
      barcodeRecord = await this.campItemBarcodeModel.create({
        camp_list_item_id: campListItemId,
        code: barcodeData.barcode_number,
        image_url: imageUrl,
        test_name: barcodeData.barcode_name,
        comment: barcodeData.comment || null,
      });
      console.log('Barcode record created with ID:', barcodeRecord.id);
    } catch (error) {
      console.error('Database creation error:', error);
      throw new BadRequestException('Failed to create barcode record: ' + error.message);
    }

    return {
      success: true,
      message: 'Barcode uploaded and saved successfully',
      data: {
        camp_list_item_id: campListItemId,
        barcode_id: barcodeRecord.id,
        barcode_number: barcodeData.barcode_number,
        barcode_name: barcodeData.barcode_name,
        image_url: imageUrl,
        comment: barcodeData.comment,
      },
    };
  }


  /**
   * Update TRF number for a camp list item
   */
  async updateTrfNumber(id: number, trfNumber: string): Promise<{ success: boolean; message: string }> {
    const campListItem = await this.campListItemModel.findByPk(id);
    if (!campListItem) {
      throw new NotFoundException(`Camp list item with ID ${id} not found`);
    }
    await campListItem.update({ trf_number: trfNumber });
    return {
      success: true,
      message: 'TRF number updated successfully',
    };
  }

  async deletecamplistItem(id: number): Promise<{ success: boolean; message: string }> {
    const campListItem = await this.campListItemModel.findByPk(id);
    if (!campListItem) {
      throw new NotFoundException(`Camp list item with ID ${id} not found`);
    }
    await campListItem.destroy();
    return {
      success: true,
      message: 'Camp list item deleted successfully',
    };
  }

  async deletecamplist(id: number): Promise<{ success: boolean; message: string }> {
    const camp = await this.campListModel.findByPk(id);
    if (!camp) {
      throw new NotFoundException(`Camp list with ID ${id} not found`);
    }

    // Delete all associated camp list items
    await this.campListItemModel.destroy({
      where: { camp_id: id }
    });

    // Delete the camp
    await camp.destroy();

    return {
      success: true,
      message: 'Camp and its camp list items deleted successfully',
    };
  }
}
