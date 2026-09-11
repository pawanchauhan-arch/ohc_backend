import * as AWS from 'aws-sdk';
import { PassThrough, Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

const s3 = new AWS.S3({
  accessKeyId: process.env.S3AccessKey, 
  secretAccessKey: process.env.SecretKey, 
  region: process.env.AWS_REGION, 
});

// const BUCKET_NAME = process.env.BUCKET_NAME_BANNER;

/**
 * Uploads a file to AWS S3 and returns the file URL.
 * @param stream - Readable stream of file/video.
 * @param file - The file object received from Multer.
 * @param bucketName - The name of the S3 bucket.
 * @returns A promise resolving to the uploaded file URL.
 */
export async function uploadToS3(file: Express.Multer.File , bucketName: string): Promise<string> {


  console.log("bucket name is :" , bucketName)
  if (!file) {
    throw new Error("No file provided");
  }

  const fileExtension = file.originalname.split(".").pop(); // Extract file extension
  const fileName = `${uuidv4()}.${fileExtension}`; // Generate a unique filename

  const params = {
    Bucket: bucketName,
    Key: fileName, // The filename in S3
    Body: file.buffer, // The file content
    ContentType: file.mimetype, // The file type
  };

  // Upload to S3
  // const uploadResult = await s3.upload(params).promise();

  // return uploadResult.Location; // Return the uploaded file's URL

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // Return the S3 URL of the uploaded file
  } catch (error) {
    throw new Error('Error uploading file to S3: ' + error.message);
  }
}

/**
 * Uploads a file to AWS S3 with custom folder structure and returns the file URL.
 * @param file - The file object received from Multer.
 * @param bucketName - The name of the S3 bucket.
 * @param folderPath - The folder path in S3 (e.g., 'user123/barcode' or 'user123/idproof').
 * @returns A promise resolving to the uploaded file URL.
 */
export async function uploadToS3WithFolder(
  file: Express.Multer.File, 
  bucketName: string, 
  folderPath: string
): Promise<string> {
  console.log("bucket name is:", bucketName);
  console.log("folder path is:", folderPath);
  
  if (!file) {
    throw new Error("No file provided");
  }

  const fileExtension = file.originalname.split(".").pop(); // Extract file extension
  const fileName = `${uuidv4()}.${fileExtension}`; // Generate a unique filename
  const key = `${folderPath}/${fileName}`; // Create the full S3 key with folder path

  const params = {
    Bucket: bucketName,
    Key: key, // The filename in S3 with folder path
    Body: file.buffer, // The file content
    ContentType: file.mimetype, // The file type
  };

  try {
    const data = await s3.upload(params).promise();
    return data.Location; // Return the S3 URL of the uploaded file
  } catch (error) {
    throw new Error('Error uploading file to S3: ' + error.message);
  }
}

export const uploadStreamToS3 = async (
  stream: Readable,
  key: string,
  contentType: string,
): Promise<string> => {
  // const s3 = new AWS.S3();
  const pass = new PassThrough();

  const upload = s3.upload({
    Bucket: process.env.BUCKET_NAME_RECORDING,
    Key: key,
    Body: pass,
    ContentType: contentType,
  }).promise();

  stream.pipe(pass);
  const data = await upload;

  return data.Location; 
};
