// src/lab-testing/services/lab-result.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize, Model } from 'sequelize-typescript';

// Import Entities
import { Cbc } from '../../models/health-tests/cbc.model';
import { Biochemistry } from '../../models/health-tests/biochemistry.model';
import { LipidProfile } from '../../models/health-tests/lipid_profile.model';
import { Kft } from '../../models/health-tests/kft.model';
import { Lft } from '../../models/health-tests/lft.model';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';

// Import Config
import { LabTable, resolveLabTestMapping } from './lab-test-config';
import { parseBoundedLabValue } from '../../utils/lab-value.util';

// Define a Union Type for all health models to satisfy TypeScript generics
type HealthModel = 
  | typeof Cbc 
  | typeof Biochemistry 
  | typeof LipidProfile 
  | typeof Kft 
  | typeof Lft;

interface IncomingTestResult {
  test_name: string;
  calculated_value: string | number | null;
  profile_name?: string;
  package_name?: string;
}

type CbcBucket = Record<string, number | null>;

interface CbcUnitEntry {
  value: number | null;
  units: string;
}

@Injectable()
export class LabResultService {
  private readonly logger = new Logger(LabResultService.name);

  constructor(
    @InjectModel(Cbc)
    private readonly cbcModel: typeof Cbc,

    @InjectModel(Biochemistry)
    private readonly biochemistryModel: typeof Biochemistry,

    @InjectModel(LipidProfile)
    private readonly lipidProfileModel: typeof LipidProfile,

    @InjectModel(Kft)
    private readonly kftModel: typeof Kft,

    @InjectModel(Lft)
    private readonly lftModel: typeof Lft,

    @InjectModel(driverhealthcheckup)
    private readonly driverHealthCheckupModel: typeof driverhealthcheckup,

    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  /**
   * Persists `selected_test.mobilab_tests` (FE contract) into dedicated lab tables.
   */
  async syncMobilabTestsToTables(
    driverHealthCheckupId: number,
    selectedTest: Record<string, unknown> | null | undefined,
  ): Promise<void> {
    const mobilabTests = selectedTest?.mobilab_tests;
    if (!mobilabTests || typeof mobilabTests !== 'object' || Array.isArray(mobilabTests)) {
      return;
    }

    const tableBuckets: Partial<Record<LabTable, Record<string, number | null>>> = {};

    for (const [sectionKey, sectionData] of Object.entries(
      mobilabTests as Record<string, unknown>,
    )) {
      if (!sectionData || typeof sectionData !== 'object' || Array.isArray(sectionData)) {
        continue;
      }

      for (const [paramKey, entry] of Object.entries(
        sectionData as Record<string, unknown>,
      )) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;

        const testEntry = entry as { key?: string; value?: string | number | null };
        const rawKey = testEntry.key ?? paramKey;
        const mapping = resolveLabTestMapping(String(rawKey), sectionKey);

        if (!mapping) {
          this.logger.warn(
            `Unmapped mobilab_tests key: "${rawKey}" (section=${sectionKey}) - Skipping.`,
          );
          continue;
        }

        const numericValue = this.parseValue(testEntry.value ?? null);
        if (numericValue === null) continue;

        if (!tableBuckets[mapping.targetTable]) {
          tableBuckets[mapping.targetTable] = {};
        }
        tableBuckets[mapping.targetTable]![mapping.targetColumn] = numericValue;
      }
    }

    if (Object.keys(tableBuckets).length === 0) return;

    await this.saveToDatabase(driverHealthCheckupId, tableBuckets);

    const cbcBucket = tableBuckets[LabTable.CBC];
    if (cbcBucket && Object.keys(cbcBucket).length > 0) {
      await this.syncCbcUnitToSelectedTest(driverHealthCheckupId, cbcBucket);
    }
  }

  /**
   * Main entry point to process results for a specific driver.
   */
  async processLabResults(driverHealthCheckupId: number, results: IncomingTestResult[]) {
    // Initialize buckets for each table type
    const tableBuckets: Partial<Record<LabTable, Record<string, number | null>>> = {};

    // 1. ITERATE & MAP
    for (const result of results) {
      if (!this.isValidResult(result)) continue;

      const mapping = resolveLabTestMapping(result.test_name);

      if (!mapping) {
        this.logger.warn(`Unmapped Test Found: "${result.test_name}" - Skipping.`);
        continue;
      }

      // Initialize bucket if not exists
      if (!tableBuckets[mapping.targetTable]) {
        tableBuckets[mapping.targetTable] = {};
      }

      const numericValue = this.parseValue(result.calculated_value);
      
      // Store value: buckets['lipid_profile']['cholesterol'] = 150
      tableBuckets[mapping.targetTable]![mapping.targetColumn] = numericValue;
    }

    // 2. SAVE TO DATABASE
    await this.saveToDatabase(driverHealthCheckupId, tableBuckets);

    // 3. Keep FE-facing CBC payload in selected_test while preserving existing keys.
    const cbcBucket = tableBuckets[LabTable.CBC];
    if (cbcBucket && Object.keys(cbcBucket).length > 0) {
      await this.syncCbcUnitToSelectedTest(driverHealthCheckupId, cbcBucket);
    }
  }

  // --- Helper Methods ---

  private isValidResult(result: IncomingTestResult): boolean {
    return (
      result.calculated_value !== null &&
      result.calculated_value !== undefined &&
      result.calculated_value !== ''
    );
  }

  private parseValue(value: string | number | null): number | null {
    return parseBoundedLabValue(value).numericValue;
  }

  private buildCbcUnitPayload(cbcData: CbcBucket): Record<string, CbcUnitEntry> {
    // FE contract: cbc_unit uses spreadsheet-friendly keys while DB keeps snake_case columns.
    const map: Array<{ dbColumn: string; key: string; units: string }> = [
      { dbColumn: 'total_leucocyte_count', key: 'WBC', units: '10^3/uL' },
      { dbColumn: 'abs_neutrophil_count', key: 'NEUT_HASH', units: '10^3/uL' },
      { dbColumn: 'neutrophils', key: 'NEUT_PERCENT', units: '%' },
      { dbColumn: 'abs_lymphocyte_count', key: 'LYM_HASH', units: '10^3/uL' },
      { dbColumn: 'lymphocytes', key: 'LYM_PERCENT', units: '%' },
      { dbColumn: 'abs_mixed_cells_count', key: 'MXD_HASH', units: '10^3/uL' },
      { dbColumn: 'mixed_cells_percent', key: 'MXD_PERCENT', units: '%' },
      { dbColumn: 'rbc_count', key: 'RBC', units: '10^6/uL' },
      { dbColumn: 'haemoglobin', key: 'HGB', units: 'g/dL' },
      { dbColumn: 'packed_cell_volume', key: 'HCT', units: '%' },
      { dbColumn: 'mcv', key: 'MCV', units: 'fL' },
      { dbColumn: 'mch', key: 'MCH', units: 'pg' },
      { dbColumn: 'mchc', key: 'MCHC', units: 'g/dL' },
      { dbColumn: 'rdw_sd', key: 'RDW_SD', units: 'fL' },
      { dbColumn: 'rdw_cv', key: 'RDW_CV', units: '%' },
      { dbColumn: 'platelet_count', key: 'PLT', units: '10^3/uL' },
      { dbColumn: 'pdw', key: 'PDW', units: 'fL' },
      { dbColumn: 'mpv', key: 'MPV', units: 'fL' },
      { dbColumn: 'pct', key: 'PCT', units: '%' },
      { dbColumn: 'p_lcr', key: 'P_LCR', units: '%' },
      { dbColumn: 'p_lcc', key: 'P_LCC', units: '10^3/uL' },
      { dbColumn: 'plr', key: 'PLR', units: '' },
      { dbColumn: 'nlr', key: 'NLR', units: '' },
    ];

    const payload: Record<string, CbcUnitEntry> = {};
    for (const item of map) {
      if (Object.prototype.hasOwnProperty.call(cbcData, item.dbColumn)) {
        payload[item.key] = {
          value: cbcData[item.dbColumn] ?? null,
          units: item.units,
        };
      }
    }
    return payload;
  }

  private async syncCbcUnitToSelectedTest(
    driverHealthCheckupId: number,
    cbcData: CbcBucket,
  ): Promise<void> {
    const checkup = await this.driverHealthCheckupModel.findByPk(driverHealthCheckupId);
    if (!checkup) {
      this.logger.warn(`Health checkup ${driverHealthCheckupId} not found for CBC selected_test sync.`);
      return;
    }

    const cbcUnit = this.buildCbcUnitPayload(cbcData);
    if (Object.keys(cbcUnit).length === 0) return;

    const existingSelected = checkup.selected_test;
    let selectedTestPayload: Record<string, any> = {};
    if (existingSelected && typeof existingSelected === 'object' && !Array.isArray(existingSelected)) {
      selectedTestPayload = { ...existingSelected };
    } else if (typeof existingSelected === 'string') {
      try {
        const parsed = JSON.parse(existingSelected);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          selectedTestPayload = parsed;
        }
      } catch {
        selectedTestPayload = {};
      }
    }

    selectedTestPayload.cbc_unit = {
      ...(selectedTestPayload.cbc_unit ?? {}),
      ...cbcUnit,
    };

    await checkup.update({ selected_test: selectedTestPayload });
  }

  private async saveToDatabase(
    driverId: number,
    buckets: Partial<Record<LabTable, any>>
  ) {
    const transaction = await this.sequelize.transaction();

    try {
      // Loop through the populated buckets
      for (const tableName of Object.keys(buckets) as LabTable[]) {
        const data = buckets[tableName];

        if (!data || Object.keys(data).length === 0) continue;

        // Add the Primary/Foreign Key
        data.driverhealthcheckups_id = driverId;

        this.logger.debug(`Upserting data into [${tableName}] for DriverID: ${driverId}`);

        // Get the specific model for this table name
        const model = this.getModelForTable(tableName);

        if (model) {
          // Perform Upsert (Insert or Update)
          await model.upsert(data, { transaction });
        } else {
          this.logger.error(`No model found for table: ${tableName}`);
        }
      }

      await transaction.commit();
      this.logger.log(`Successfully processed lab results for Checkup ID ${driverId}`);
    } catch (error) {
      this.logger.error(`Failed to save lab results for Checkup ID ${driverId}`);
      if (error instanceof Error) {
        this.logger.error(error.message, error.stack);
      }
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Returns the correct Model Class based on the Table Enum.
   */
  private getModelForTable(tableName: LabTable): any {
    switch (tableName) {
      case LabTable.CBC:
        return this.cbcModel;
      case LabTable.BIOCHEMISTRY:
        return this.biochemistryModel;
      case LabTable.LIPID_PROFILE:
        return this.lipidProfileModel;
      case LabTable.KFT:
        return this.kftModel;
      case LabTable.LFT:
        return this.lftModel;
      default:
        return undefined;
    }
  }

}