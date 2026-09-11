import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import * as AWS from 'aws-sdk';
import * as multer from 'multer';
import * as multerS3 from 'multer-s3';
import * as path from 'path';

@Injectable()
export class UploadInterceptor implements NestInterceptor {
  private upload: any;

  // Remove constructor injection
  constructor(fieldName: string = 'file') {
    const s3 = new AWS.S3({
      accessKeyId: process.env.S3_ACCESS_ID,
      secretAccessKey: process.env.S3_SECRET_KEY,
      region: process.env.AWS_REGION,
    });

    const storage = multerS3({
      s3,
      bucket: process.env.S3_BUCKET_NAME,
      key: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const filename = uniqueSuffix + path.extname(file.originalname);
        cb(null, filename);
      },
    });

    this.upload = multer({ storage }).single(fieldName);
  }

  intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();

    // Wrap Multer in a Promise and convert to Observable
    const uploadPromise = new Promise<void>((resolve, reject) => {
      this.upload(req, res, (err: any) => {
        if (err) {
          reject(new BadRequestException(err.message || 'File upload failed'));
        } else {
          resolve();
        }
      });
    });

    return from(uploadPromise).pipe(() => next.handle());
  }
}

// ✅ Factory function to pass the fieldName
export function UploadInterceptorFactory(fieldName: string = 'file') {
  return new UploadInterceptor(fieldName);
}
