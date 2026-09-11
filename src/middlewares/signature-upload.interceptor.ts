import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { Observable } from 'rxjs';

@Injectable()
export class SignatureUploadInterceptor implements NestInterceptor {
  private s3Client = new AWS.S3({
    accessKeyId: process.env.S3_ACCESS_ID,
    secretAccessKey: process.env.S3_SECRET_KEY,
    region: process.env.AWS_REGION,
  });

  private Bucket = process.env.S3_BUCKET_NAME;

  private decodeBase64Image(dataString: string) {
    const matches = dataString.replace(/\s/g, '')
      .match(/^data:(.+);base64,([\s\S]+)$/);

    if (!matches) {
      throw new BadRequestException('Invalid base64 format');
    }

    return {
      mimeType: matches[1],
      buffer: Buffer.from(matches[2], 'base64'),
    };
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();

    const fileData = req.body?.file_url;
    const fileName = req.body?.name;
    const folderName = req.body?.folder_name;
    const driverId = req.body?.driver_id;

    if (!fileData) throw new BadRequestException('file_url missing');
    if (!fileName) throw new BadRequestException('name missing');

    try {
      const { buffer, mimeType } = this.decodeBase64Image(fileData);
      let key = `uploads/${fileName}`;
      if (folderName) {
        const normalizedFolderName = String(folderName).trim();
        if (!normalizedFolderName) {
          throw new BadRequestException('folder_name must be valid');
        }
        const normalizedDriverId = driverId ? String(driverId).trim() : '';
        const folderPrefix = normalizedDriverId
          ? `${normalizedFolderName}/${normalizedDriverId}/`
          : `${normalizedFolderName}/`;
        const folderExists = await this.s3Client
          .listObjectsV2({
            Bucket: this.Bucket,
            Prefix: folderPrefix,
            MaxKeys: 1,
          })
          .promise();
        if (!folderExists.Contents || folderExists.Contents.length === 0) {
          await this.s3Client
            .putObject({
              Bucket: this.Bucket,
              Key: folderPrefix,
              Body: '',
            })
            .promise();
        }
        key = `${folderPrefix}${fileName}`;
      }

      const uploadResult = await this.s3Client
        .upload({
          Bucket: this.Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimeType,
        })
        .promise();

      req.fileData = uploadResult;

      return next.handle();
    } catch (err: any) {
      throw new InternalServerErrorException(err.message);
    }
  }
}
