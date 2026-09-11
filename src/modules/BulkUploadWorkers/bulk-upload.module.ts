import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { BulkUploadService } from './bulk-upload.service';
import { BulkUploadTemplateService } from './bulk-upload-template.service';
import { LookupService } from './lookup/lookup.service';
import { PatientBulkUploadController } from './patient-bulk-upload.controller';

import { DRIVERMASTER } from 'src/models/DriverMaster';

// Adjust this path according to your project structure
import { PatientModule } from '../patient/patient.module';

@Module({
  imports: [
    SequelizeModule.forFeature([
      DRIVERMASTER,
    ]),

    PatientModule, 
  ],

  controllers: [
    PatientBulkUploadController,
  ],

  providers: [
    BulkUploadService,
    BulkUploadTemplateService,
    LookupService,
  ],

  exports: [
    BulkUploadService,
    BulkUploadTemplateService,
    LookupService,
  ],
})
export class BulkUploadWorkersModule {}