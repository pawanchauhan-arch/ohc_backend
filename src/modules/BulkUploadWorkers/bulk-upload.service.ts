import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { BulkUploadRowDto, ResolvedBulkRow } from './dto/bulk-upload-row.dto';
import { LookupService } from './lookup/lookup.service';
import { BulkUploadTemplateService } from './bulk-upload-template.service';
import {
  TEMPLATE_COLUMNS,
  TEMPLATE_SHEET_NAME,
} from './config/template-columns.config';

const VALID_GENDERS = ['male', 'female', 'other'];
const VALID_CATEGORIES = ['apl', 'bpl'];

@Injectable()
export class BulkUploadService {
  constructor(
    private readonly lookupService: LookupService,
    private readonly templateService: BulkUploadTemplateService,
  ) {}

  async generateTemplate(tenantId: number): Promise<Buffer> {
    return this.templateService.generate(tenantId);
  }

  async parseExcelFile(buffer: Buffer): Promise<BulkUploadRowDto[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet =
      workbook.getWorksheet(TEMPLATE_SHEET_NAME) ?? workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Excel file has no data sheet');
    }

    const headerRow = sheet.getRow(1);
    const columnMap: Record<string, number> = {};

    headerRow.eachCell((cell, colNumber) => {
      const headerText = String(cell.value ?? '')
        .replace(/\s*\*$/, '')
        .trim()
        .toLowerCase();
      const matched = TEMPLATE_COLUMNS.find(
        (col) => col.header.toLowerCase() === headerText,
      );
      if (matched) {
        columnMap[matched.key] = colNumber;
      }
    });

    const keyToCol: Record<string, number> = {};
    TEMPLATE_COLUMNS.forEach((col, idx) => {
      keyToCol[col.key] = columnMap[col.key] ?? idx + 1;
    });

    const rows: BulkUploadRowDto[] = [];

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const getValue = (key: string): string => {
        const colIdx = keyToCol[key];
        const cell = row.getCell(colIdx);
        const val = cell.value;
        if (val === null || val === undefined) return '';
        if (typeof val === 'object' && 'text' in (val as object)) {
          return String((val as { text: string }).text).trim();
        }
        return String(val).trim();
      };

      const name = getValue('name');
      const contactNumber = getValue('contactNumber');

      if (!name && !contactNumber) return;

      const dob = getValue('dateOfBirthOrAge');
      let ageInfo = { age: 0, month: 0, day: 0 };
      if (dob) {
        ageInfo = this.ageCalculator(dob);
      }

      rows.push({
        rowNumber,
        name,
        contactNumber,
        gender: getValue('gender'),
        title: getValue('title'),
        employeeId: getValue('employeeId'),
        dateOfBirthOrAge: getValue('dateOfBirthOrAge'),
        idProof_name: getValue('idProof_name'),
        idProof_number: getValue('idProof_number'),
        blood_group: getValue('blood_group'),
        category: getValue('category'),
        occupation: getValue('occupation'),
        country: getValue('country'),
        state: getValue('state'),
        district: getValue('district'),
        department: getValue('department'),
        designation: getValue('designation'),
        localAddress: getValue('localAddress'),
        permanentAddress: getValue('permanentAddress'),
        pin: getValue('pin'),
        emergencyContactName: getValue('emergencyContactName'),
        emergencyContactNumber: getValue('emergencyContactNumber'),
        co: getValue('co'),
        relationship: getValue('relationship'),
        residentialstatus: getValue('residentialstatus'),
        healthCardNumber: getValue('healthCardNumber'),
        iage: ageInfo.age,
        imonth: ageInfo.month,
        idays: ageInfo.day,
        age: ageInfo.age,
      });
    });

    if (rows.length === 0) {
      throw new BadRequestException('No data rows found in Excel file');
    }

    if (rows.length > 500) {
      throw new BadRequestException('Maximum 500 rows allowed per upload');
    }

    return rows;
  }

  validateRow(row: BulkUploadRowDto): string[] {
    const errors: string[] = [];

    if (!row.name) errors.push('Name is required');
    if (!row.contactNumber) errors.push('Contact number is required');
    else if (!/^\d{10}$/.test(row.contactNumber.replace(/\s/g, ''))) {
      errors.push('Contact number must be 10 digits');
    }
    if (!row.gender) errors.push('Gender is required');
    else if (!VALID_GENDERS.includes(row.gender.toLowerCase())) {
      errors.push(`Gender must be one of: Male, Female, Other`);
    }
    if (!row.country) errors.push('Country is required');
    if (!row.state) errors.push('State is required');
    if (!row.district) errors.push('District is required');

    if (
      row.category &&
      !VALID_CATEGORIES.includes(row.category.toLowerCase())
    ) {
      errors.push('Category must be APL or BPL');
    }

    if (row.dateOfBirthOrAge) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(row.dateOfBirthOrAge)) {
        errors.push('Date of birth must be in YYYY-MM-DD format');
      }
    }

    return errors;
  }

  async resolveRow(
    row: BulkUploadRowDto,
    tenantId: number,
  ): Promise<ResolvedBulkRow> {
    const locationIds = await this.lookupService.resolveLocationIds(
      row.country,
      row.state,
      row.district,
    );

    const department_id = await this.lookupService.resolveDepartmentId(
      tenantId,
      row.department ?? '',
    );
    const designation_id = await this.lookupService.resolveDesignationId(
      tenantId,
      row.designation ?? '',
    );

    return {
      ...row,
      ...locationIds,
      department_id,
      designation_id,
    };
  }

  /**
   * Map resolved row to the payload format expected by registerPatient.
   */
  toPatientPayload(resolved: ResolvedBulkRow): Record<string, unknown> {
    const genderMap: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      other: 'Other',
    };

    return {
      name: resolved.name,
      contactNumber: resolved.contactNumber.replace(/\s/g, ''),
      gender: genderMap[resolved.gender.toLowerCase()] ?? resolved.gender,
      title: resolved.title || 'Mr',
      employeeId: resolved.employeeId,
      dateOfBirthOrAge: resolved.dateOfBirthOrAge,
      idProof_name: resolved.idProof_name,
      idProof_number: resolved.idProof_number,
      blood_group: resolved.blood_group,
      category: resolved.category?.toUpperCase(),
      occupation: resolved.occupation,
      country_id: resolved.country_id,
      state_id: resolved.state_id,
      district_id: resolved.district_id,
      department_id: resolved.department_id?.toString(),
      designation_id: resolved.designation_id?.toString(),
      localAddress: resolved.localAddress,
      permanentAddress: resolved.permanentAddress,
      pin: resolved.pin,
      emergencyContactName: resolved.emergencyContactName,
      emergencyContactNumber: resolved.emergencyContactNumber,
      co: resolved.co || 'N/A',
      relationship: resolved.relationship || 'Other',
      residentialstatus: resolved.residentialstatus,
      healthCardNumber: resolved.healthCardNumber,
      comingFromWebsite: 'B2B',
      disease_ids: [],
      age: resolved.age,
      iage: resolved.iage,
      idays: resolved.idays,
      imonth: resolved.imonth,
    };
  }
  ageCalculator(dateOfBirth: string) {
    const dob = dateOfBirth;

    let iage = 0;
    let imonth = 0;
    let idays = 0;

    try {
      if (dob && typeof dob === 'string') {
        const parts = dob.split('-');

        if (parts.length === 3) {
          const year = Number(parts[0]);
          const month = Number(parts[1]);
          const day = Number(parts[2]);

          const birthDate = new Date(year, month - 1, day);

          const isValidDate =
            !isNaN(birthDate.getTime()) &&
            birthDate.getFullYear() === year &&
            birthDate.getMonth() === month - 1 &&
            birthDate.getDate() === day;

          if (isValidDate) {
            const today = new Date();

            iage = today.getFullYear() - year;
            imonth = today.getMonth() + 1 - month;
            idays = today.getDate() - day;

            if (imonth < 0 || (imonth === 0 && idays < 0)) {
              iage--;
            }

            if (idays < 0) {
              imonth--;
            }

            if (imonth < 0) {
              imonth += 12;
            }

            if (idays < 0) {
              const previousMonth = new Date(
                today.getFullYear(),
                today.getMonth(),
                0,
              );

              idays += previousMonth.getDate();
            }
          }
        }
      }
    } catch {
      iage = 0;
      imonth = 0;
      idays = 0;
    }

    return {
      age: iage,
      month: imonth,
      day: idays,
    };
  }
}
