import {
  Controller,
  Post,
  Get,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { BulkUploadService } from './bulk-upload.service';
import { BulkUploadResult } from './dto/bulk-upload-row.dto';
import { PatientService } from 'src/modules/patient/patient.service';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
/**
 * Add these endpoints to your existing PatientController.
 *
 * GET  /patients/bulk-upload/template  → Download Excel template
 * POST /patients/bulk-upload           → Upload Excel file
 */
@UseGuards(JwtAdminGuardB2C)
@Controller('api/patients')
export class PatientBulkUploadController {
  constructor(
    private readonly bulkUploadService: BulkUploadService,
    private readonly patientService: PatientService, // Inject your existing PatientService
  ) {}

  @Get('bulk-upload/template')
  async downloadTemplate(@Req() req: any, @Res() res: Response) {
    const tenantId = req.user.tenantId;
    const buffer = await this.bulkUploadService.generateTemplate(tenantId);

    const date = new Date().toISOString().split('T')[0];
    const filename = `patient_bulk_upload_template_${date}.xlsx`;

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store',
    });

    res.send(buffer);
  }

  @Post('bulk-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException('Only .xlsx Excel files are allowed'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async bulkUpload(
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<BulkUploadResult> {
    if (!file) {
      throw new BadRequestException('Excel file is required');
    }

    const user = req.user;
    const tenantId = user.tenantId;
    const rows = await this.bulkUploadService.parseExcelFile(file.buffer);

    const result: BulkUploadResult = {
      totalRows: rows.length,
      successCount: 0,
      failureCount: 0,
      successes: [],
      errors: [],
    };

    const seenContacts = new Set<string>();
    const seenEmployeeIds = new Set<string>();

    for (const row of rows) {
      const validationErrors = this.bulkUploadService.validateRow(row);
      if (validationErrors.length > 0) {
        result.failureCount++;
        validationErrors.forEach((msg) => {
          result.errors.push({ row: row.rowNumber, message: msg });
        });
        continue;
      }

      const normalizedContact = row.contactNumber.replace(/\s/g, '');
      if (seenContacts.has(normalizedContact)) {
        result.failureCount++;
        result.errors.push({
          row: row.rowNumber,
          field: 'contactNumber',
          message: `Duplicate contact number "${normalizedContact}" in upload file`,
        });
        continue;
      }
      seenContacts.add(normalizedContact);

      if (row.employeeId) {
        if (seenEmployeeIds.has(row.employeeId)) {
          result.failureCount++;
          result.errors.push({
            row: row.rowNumber,
            field: 'employeeId',
            message: `Duplicate employee ID "${row.employeeId}" in upload file`,
          });
          continue;
        }
        seenEmployeeIds.add(row.employeeId);
      }

      try {
        const resolved = await this.bulkUploadService.resolveRow(row, tenantId);
        const payload = this.bulkUploadService.toPatientPayload(resolved);

        const registration = await this.patientService.registerPatient(
          user,
          payload,
        );

        if (registration.status) {
          result.successCount++;
          result.successes.push({
            row: row.rowNumber,
            name: row.name,
            external_id: registration.driver?.external_id ?? '',
          });
        } else {
          result.failureCount++;
          result.errors.push({
            row: row.rowNumber,
            message: registration.message || 'Registration failed',
          });
        }
      } catch (error: any) {
        result.failureCount++;
        result.errors.push({
          row: row.rowNumber,
          message: error.message || 'Failed to process row',
        });
      }
    }

    return result;
  }
}
