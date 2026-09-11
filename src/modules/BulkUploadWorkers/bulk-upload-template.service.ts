import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import {
  TEMPLATE_COLUMNS,
  SAMPLE_ROW,
  TEMPLATE_SHEET_NAME,
  MAX_DATA_ROWS,
  DATA_START_ROW,
} from './config/template-columns.config';
import { LookupService, LookupItem } from './lookup/lookup.service';

const COLORS = {
  headerBg: 'FF1D4ED8',
  headerText: 'FFFFFFFF',
  requiredBg: 'FFDBEAFE',
  sampleBg: 'FFFFF7ED',
  sampleText: 'FFEA580C',
  refHeaderBg: 'FFF3F4F6',
};

@Injectable()
export class BulkUploadTemplateService {
  constructor(private readonly lookupService: LookupService) {}

  async generate(tenantId: number): Promise<Buffer> {
    const [countries, states, districts, departments, designations] =
      await Promise.all([
        this.lookupService.getCountries(),
        this.lookupService.getStates(),
        this.lookupService.getDistricts(),
        this.lookupService.getDepartments(tenantId),
        this.lookupService.getDesignations(tenantId),
      ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LMC Health';
    workbook.created = new Date();

    this.buildInstructionsSheet(workbook);
    this.buildDataSheet(workbook, {
      countries,
      states,
      districts,
      departments,
      designations,
    });
    this.buildReferenceSheet(workbook, 'Countries', ['Name'], countries);
    this.buildReferenceSheet(workbook, 'States', ['Country', 'State Name'], states);
    this.buildReferenceSheet(workbook, 'Districts', ['State', 'District Name'], districts);
    this.buildReferenceSheet(workbook, 'Departments', ['Department Name'], departments);
    this.buildReferenceSheet(workbook, 'Designations', ['Designation Name'], designations);

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  private buildInstructionsSheet(workbook: ExcelJS.Workbook) {
    const sheet = workbook.addWorksheet('Instructions');
    sheet.getColumn(1).width = 90;

    const lines: Array<{ text: string; bold?: boolean; size?: number }> = [
      { text: 'PATIENT BULK UPLOAD — INSTRUCTIONS', bold: true, size: 14 },
      { text: '' },
      { text: 'STEP 1: Go to the "Patient Data" sheet' },
      { text: 'STEP 2: Delete the orange sample row (row 2)' },
      { text: 'STEP 3: Fill your patient records starting from row 2' },
      { text: 'STEP 4: Save as .xlsx and upload via Bulk Upload button' },
      { text: '' },
      { text: 'REQUIRED FIELDS (blue headers):', bold: true },
      { text: '  Name, Contact Number, Gender, Country, State, District' },
      { text: '' },
      { text: 'LOCATION & ORG FIELDS — USE NAMES, NOT IDs:', bold: true },
      { text: '  Country     → type country name   (see Countries sheet)' },
      { text: '  State       → type state name     (see States sheet)' },
      { text: '  District    → type district name  (see Districts sheet)' },
      { text: '  Department  → type department name (see Departments sheet)' },
      { text: '  Designation → type designation name (see Designations sheet)' },
      { text: '' },
      { text: 'FORMATTING RULES:', bold: true },
      { text: '  • Contact Number: exactly 10 digits, no spaces or dashes' },
      { text: '  • Date of Birth: YYYY-MM-DD  (example: 1990-05-15)' },
      { text: '  • Gender: Male / Female / Other' },
      { text: '  • Category: APL or BPL' },
      { text: '  • Names are case-insensitive but must match reference sheets' },
      { text: '' },
      { text: 'LIMITS:', bold: true },
      { text: `  • Maximum ${MAX_DATA_ROWS} patients per upload` },
      { text: '  • Only .xlsx format accepted' },
    ];

    lines.forEach((line, i) => {
      const row = sheet.getRow(i + 1);
      row.getCell(1).value = line.text;
      if (line.bold) row.font = { bold: true, size: line.size ?? 12 };
    });
  }

  private buildDataSheet(
    workbook: ExcelJS.Workbook,
    lookups: {
      countries: LookupItem[];
      states: LookupItem[];
      districts: LookupItem[];
      departments: LookupItem[];
      designations: LookupItem[];
    },
  ) {
    const sheet = workbook.addWorksheet(TEMPLATE_SHEET_NAME, {
      views: [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }],
    });

    sheet.columns = TEMPLATE_COLUMNS.map((col) => ({
      header: col.required ? `${col.header} *` : col.header,
      key: col.key,
      width: col.width,
    }));

    const headerRow = sheet.getRow(1);
    headerRow.height = 36;
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

    TEMPLATE_COLUMNS.forEach((col, idx) => {
      const cell = headerRow.getCell(idx + 1);
      cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: col.required ? 'FF1E40AF' : COLORS.headerBg },
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF93C5FD' } },
      };
      if (col.hint) {
        cell.note = col.hint;
      }
    });

    const sampleRow = sheet.addRow(
      TEMPLATE_COLUMNS.reduce(
        (acc, col) => ({ ...acc, [col.key]: SAMPLE_ROW[col.key] ?? '' }),
        {},
      ),
    );
    sampleRow.height = 22;
    sampleRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.sampleBg },
      };
      cell.font = { italic: true, color: { argb: COLORS.sampleText }, size: 10 };
    });

    const lastDataRow = DATA_START_ROW + MAX_DATA_ROWS - 1;

    TEMPLATE_COLUMNS.forEach((col, colIdx) => {
      const colLetter = this.colLetter(colIdx + 1);

      if (col.dropdown?.length) {
        const listFormula = `"${col.dropdown.join(',')}"`;
        for (let row = DATA_START_ROW; row <= lastDataRow; row++) {
          sheet.getCell(`${colLetter}${row}`).dataValidation = {
            type: 'list',
            allowBlank: !col.required,
            formulae: [listFormula],
            showErrorMessage: true,
            errorTitle: 'Invalid value',
            error: `Choose from: ${col.dropdown.join(', ')}`,
          };
        }
      }
    });

    this.applyLookupDropdown(
      sheet,
      'country',
      lookups.countries.map((c) => c.name),
      lastDataRow,
    );
    this.applyLookupDropdown(
      sheet,
      'department',
      lookups.departments.map((d) => d.name),
      lastDataRow,
    );
    this.applyLookupDropdown(
      sheet,
      'designation',
      lookups.designations.map((d) => d.name),
      lastDataRow,
    );

    sheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: TEMPLATE_COLUMNS.length },
    };
  }

  private applyLookupDropdown(
    sheet: ExcelJS.Worksheet,
    key: string,
    values: string[],
    lastDataRow: number,
  ) {
    if (!values.length) return;

    const colIdx = TEMPLATE_COLUMNS.findIndex((c) => c.key === key);
    if (colIdx === -1) return;

    const colLetter = this.colLetter(colIdx + 1);
    const listFormula = `"${values.slice(0, 200).join(',')}"`;

    for (let row = DATA_START_ROW; row <= lastDataRow; row++) {
      sheet.getCell(`${colLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: key !== 'country',
        formulae: [listFormula],
        showErrorMessage: true,
        errorTitle: 'Invalid value',
        error: 'Select a value from the dropdown or reference sheet',
      };
    }
  }

  private buildReferenceSheet(
    workbook: ExcelJS.Workbook,
    sheetName: string,
    headers: string[],
    items: LookupItem[],
  ) {
    const sheet = workbook.addWorksheet(sheetName);

    const allHeaders = [...headers, 'ID (reference only — do not use in upload)'];
    const headerRow = sheet.addRow(allHeaders);
    headerRow.font = { bold: true, size: 10 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.refHeaderBg },
    };

    items.forEach((item) => {
      const row: (string | number)[] = [];
      if (headers.length === 2) {
        row.push(item.parentName ?? '', item.name);
      } else {
        row.push(item.name);
      }
      row.push(item.id);
      sheet.addRow(row);
    });

    sheet.columns.forEach((col) => {
      col.width = 28;
    });

    if (items.length > 0) {
      sheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: items.length + 1, column: allHeaders.length },
      };
    }
  }

  private colLetter(col: number): string {
    let letter = '';
    let n = col;
    while (n > 0) {
      const rem = (n - 1) % 26;
      letter = String.fromCharCode(65 + rem) + letter;
      n = Math.floor((n - 1) / 26);
    }
    return letter;
  }
}
