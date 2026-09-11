import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Banner } from '../../models/Banner';
import { BannerDto } from '../Banner/Banner.dto'; // Import the DTO
import * as AWS from 'aws-sdk';
import * as multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { uploadToS3 } from 'src/utils/s3-image-upload';
import {BUCKET_NAME_BANNER} from 'config/envConfig';
import { Op } from 'sequelize';
import { title } from 'process';

@Injectable()
export class BannersService {
  private s3: AWS.S3;
  private readonly BUCKET_NAME: string = BUCKET_NAME_BANNER; // Update this with your bucket name

  constructor(
    @InjectModel(Banner)
    private bannerModel: typeof Banner,
  ) {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.S3AccessKey, // Add your AWS Access Key ID
      secretAccessKey: process.env.SecretKey, // Add your AWS Secret Access Key
      region: process.env.AWS_REGION, // The region where your S3 bucket is hosted
    });
  }

  // async createBanner(data: Partial<Banner>): Promise<Banner> {
  //   return this.bannerModel.create(data);
  // }

  // private async uploadImageToS3(file: Express.Multer.File): Promise<string> {
  //   const fileExtension = file.originalname.split('.').pop(); // Get file extension
  //   const fileName = `${uuidv4()}.${fileExtension}`; // Generate a unique file name

  //   const params = {
  //     Bucket: this.BUCKET_NAME,
  //     Key: fileName, // The file name in S3
  //     Body: file.buffer, // The file buffer content
  //     ContentType: file.mimetype, // The MIME type of the file
  //     // ACL: 'public-read', // Make the file publicly accessible
  //   };

  //   // Upload to S3
  //   const uploadResult = await this.s3.upload(params).promise();

  //   // Return the public URL of the uploaded file
  //   return uploadResult.Location;
  // }

  async createBanner(
    data: Partial<Banner>,
    imageFile: Express.Multer.File,
  ): Promise<Banner> {
    let imageUrl: string = null;

    // Check if an image file is provided and upload it to S3
    if (imageFile) {
      imageUrl = await uploadToS3(imageFile , this.BUCKET_NAME);
    }

    // Get the last banner_id from the database and increment by 1
    let bannerId: number;
    const lastBanner = await this.bannerModel.findOne({
      order: [['banner_id', 'DESC']], // Order by banner_id in descending order
    });

    // If a record exists, increment the last banner_id by 1; otherwise, start with 1
    if (lastBanner) {
      bannerId = lastBanner.banner_id + 1;
    } else {
      bannerId = 1; // Start with 1 if no records exist
    }

    // Ensure all attributes are present and missing ones are set to null,
    // and include the S3 URL for the image
    const bannerData: Partial<Banner> = {
      banner_id: bannerId,
      language: data.language ?? null,
      category: data.category ?? null,
      state: data.state ?? null,
      location: data.location ?? null,
      workforce_type: data.workforce_type ?? null,
      hyperlink: data.hyperlink ?? null,
      video_link: data.video_link ?? null,
      image_link: imageUrl ?? null, // Store the image link from S3
      disease: data.disease ?? null,
      title: data.title ?? null,
      place_holder_in_app: data.place_holder_in_app ?? null,
    };

    // Create the banner in the database
    return this.bannerModel.create(bannerData);
  }

  async getAllBanners(): Promise<Banner[]> {
    return this.bannerModel.findAll();
  }

  async getBannerById(banner_id: number): Promise<Banner> {
    const banner = await this.bannerModel.findByPk(banner_id);
    if (!banner) {
      throw new NotFoundException(`Banner with ID ${banner_id} not found`);
    }
    return banner;
  }

  async updateBanner(
    banner_id: number,
    data: Partial<Banner>,
  ): Promise<Banner> {
    const banner = await this.getBannerById(banner_id);
    return banner.update(data);
  }

  async deleteBanner(banner_id: number): Promise<void> {
    const banner = await this.getBannerById(banner_id);
    await banner.destroy();
  }

  // Updated filterBanners method for POST request
  // async filterBanners(filterOptions: BannerDto): Promise<Banner[]> {
  //   const { language, location, disease, workforce_type, place_holder_in_app } =
  //     filterOptions;

  //   // Build query conditions dynamically
  //   const where: any = {};

  //   where.place_holder_in_app = place_holder_in_app;

  //   if (language) where.language = language;
  //   if (location) where.location = location;
  //   if (disease) where.disease = disease;
  //   if (workforce_type) where.workforce_type = workforce_type;
  //   // if (place_holder_in_app) where.place_holder_in_app = place_holder_in_app;

  //   // Query the database using the conditions
  //   return this.bannerModel.findAll({
  //     where,
  //   });
  // }


async filterBanners(filterOptions: BannerDto): Promise<Banner[]> {
  const { language, location, disease, workforce_type, place_holder_in_app } =
    filterOptions;

  const where: any = {};
  where.place_holder_in_app = place_holder_in_app;

  if (language) where.language = language;
  if (location) where.location = location;
  if (workforce_type) where.workforce_type = workforce_type;

  if (disease) {
  const diseaseArray = disease.split(',').map(d => d.trim());

  where[Op.or] = diseaseArray.map(d => ({
    title: {
      [Op.iLike]: `%${d}%`,
    },
  }));

  console.log('🔍 Sequelize WHERE[Op.or] disease filter:', where[Op.or]);
}

console.log('📦 Final Sequelize WHERE clause:', where);



  return this.bannerModel.findAll({ where });
}


  async uploadBannerImage(file: Express.Multer.File): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new Error("No file provided");
    }
  
    const fileExtension = file.originalname.split(".").pop(); // Extract file extension
    const fileName = `${uuidv4()}.${fileExtension}`; // Generate a unique filename
  
    const params = {
      Bucket: this.BUCKET_NAME,
      Key: fileName, // The filename in S3
      Body: file.buffer, // The file content
      ContentType: file.mimetype, // The file type
    };
  
    // Upload to S3
    const uploadResult = await this.s3.upload(params).promise();
  
    return { imageUrl: uploadResult.Location }; // Return the uploaded file's URL
  }

  async createBanner2(
    data: Partial<Banner>,
    imageFile: Express.Multer.File,
): Promise<Banner> {
    let imageUrl: string = data.image_link;

    // 🔹 Upload image to S3 if provided
    if (imageFile) {
        imageUrl = await uploadToS3(imageFile , this.BUCKET_NAME);
    }

    console.log("Received data:", data); // ✅ Debugging
    console.log("Received place_holder_in_app:", data.place_holder_in_app);
    console.log("Received image link:", data.image_link);
    console.log("Uploaded image URL:", imageUrl);

    // 🔹 Get the last banner_id from the database and increment
    let bannerId: number;
    const lastBanner = await this.bannerModel.findOne({
        order: [['banner_id', 'DESC']], 
    });

    bannerId = lastBanner ? lastBanner.banner_id + 1 : 1; 

    // 🔹 Ensure all fields are set correctly
    const bannerData: Partial<Banner> = {
        banner_id: bannerId,
        language: data.language ?? null,
        category: data.category ?? null,
        state: data.state ?? null,
        location: data.location ?? null,
        workforce_type: data.workforce_type ?? null,
        hyperlink: data.hyperlink ?? null,
        video_link: data.video_link ?? null,
        image_link: data.image_link , // ✅ Fix: Ensuring image_link is stored
        disease: data.disease ?? null,
        title: data.title ?? null,
        place_holder_in_app: data.place_holder_in_app || null, // ✅ Fix: Ensuring place_holder_in_app is stored
    };

    console.log("Final bannerData before saving:", bannerData);

    // 🔹 Create the banner in the database
    return this.bannerModel.create(bannerData);
}

  

}