import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';
import { User } from '../../models/User';
import { Corporate } from '../../models/corporate';
import { AnalyzeHealthDto } from './dto/analyze-health.dto';
import { AnalysisResultDto, ConcernDto, AnalysisSummaryDto } from './dto/analysis-result.dto';
import {
  FilterHealthAnalysisDto,
  FilterHealthAnalysisResponseDto,
  TestGroupDto,
  ColorCategoryAveragesDto,
  ColorCategoriesDto,
  ColorCategoryGroupDto,
  DriverCategoryDataDto,
  TestDataPointDto,
} from './dto/filter-health-analysis.dto';
import {
  CohortHealthAnalysisDto,
  CohortHealthAnalysisResponseDto,
  CohortTestDataDto,
  CohortPatientCountDto,
  CohortPatientDriverIdsDto,
} from './dto/cohort-health-analysis.dto';
import {
  DriverTestHistoryDto,
  DriverTestHistoryResponseDto,
  DriverTestHistoryItemDto,
  DriverTestValueDto,
} from './dto/driver-test-history.dto';
import {
  DriverFullTestHistoryResponseDto,
  DriverFullTestRecordDto,
  DriverFullTestItemDto,
  DriverFullTestHistoryDriverDto,
  DriverFullTestTrend,
} from './dto/driver-full-test-history.dto';
import { classifyParameter } from './utils/health-parameter-classifier.util';
import * as ExcelJS from 'exceljs';

// Health parameter thresholds - Updated as per screenshot requirements
export const HEALTH_THRESHOLDS = {
  BLOOD_SUGAR: {
    MODERATE: { min: 141, max: 349 },
    HIGH: { min: 350, max: Infinity }
  },
  BLOOD_PRESSURE: {
    MODERATE: { systolic: { min: 130, max: 179 }, diastolic: { min: 81, max: 119 } },
    HIGH: { systolic: { min: 180, max: Infinity }, diastolic: { min: 120, max: Infinity } }
  },
  PULSE: {
    MODERATE: { low: { min: 51, max: 59 }, high: { min: 101, max: 119 } },
    HIGH: { low: { min: 0, max: 49 }, high: { min: 121, max: Infinity } }
  },
  HEMOGLOBIN: {
    HIGH: { min: 0, max: 7.9 }
  },
  EYE_VISION: {
    HIGH: { value: '6/60' }
  }
};

@Injectable()
export class HealthAnalysisService {
  constructor(
    @InjectModel(driverhealthcheckup)
    private driverHealthCheckupModel: typeof driverhealthcheckup,
    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(CETMANAGEMENT)
    private cetManagementModel: typeof CETMANAGEMENT,
    @InjectModel(Center)
    private centerModel: typeof Center,
    @InjectModel(User)
    private userModel: typeof User,
    @InjectModel(Corporate)
    private corporateModel: typeof Corporate,
  ) {}

  /**
   * Analyze health checkup for concerns
   */
  async analyzeHealthCheckup(healthCheckupId: number): Promise<AnalysisResultDto> {
    // Get health checkup data with related information
    const healthCheckup = await this.driverHealthCheckupModel.findOne({
      where: { id: healthCheckupId },
      include: [
        {
          model: this.driverMasterModel,
          as: 'driver',
        },
        {
          model: this.cetManagementModel,
          as: 'CETMANAGEMENT',
        },
      ],
    });

    if (!healthCheckup) {
      throw new NotFoundException(`Health checkup with ID ${healthCheckupId} not found`);
    }

    // Analyze health parameters
    const concerns: ConcernDto[] = [];
    
    // Analyze blood sugar
    const bloodSugarConcerns = this.analyzeBloodSugar(healthCheckup);
    concerns.push(...bloodSugarConcerns);

    // Analyze blood pressure
    const bloodPressureConcerns = this.analyzeBloodPressure(healthCheckup);
    concerns.push(...bloodPressureConcerns);

    // Analyze pulse
    const pulseConcerns = this.analyzePulse(healthCheckup);
    concerns.push(...pulseConcerns);

    // Analyze hemoglobin
    const hemoglobinConcerns = this.analyzeHemoglobin(healthCheckup);
    concerns.push(...hemoglobinConcerns);

    // Analyze eye vision
    const eyeVisionConcerns = this.analyzeEyeVision(healthCheckup);
    concerns.push(...eyeVisionConcerns);

    // Calculate summary
    const summary: AnalysisSummaryDto = {
      totalConcerns: concerns.length,
      moderateCount: concerns.filter(c => c.level === 'MODERATE').length,
      highCount: concerns.filter(c => c.level === 'HIGH').length,
    };

    return {
      success: true,
      concerns,
      summary,
    };
  }

  /**
   * Analyze blood sugar levels
   */
  private analyzeBloodSugar(healthCheckup: any): ConcernDto[] {
    const concerns: ConcernDto[] = [];
    
    // Extract from selected_test JSON
    const selectedTest = healthCheckup.selected_test;
    if (!selectedTest || !selectedTest.random_blood_sugar_unit) {
      return concerns; // Skip if missing
    }

    const bloodSugarData = selectedTest.random_blood_sugar_unit;
    if (!bloodSugarData.value) {
      return concerns; // Skip if no value
    }

    const value = parseFloat(bloodSugarData.value);
    if (isNaN(value)) {
      return concerns; // Skip if invalid value
    }

    // Check for moderate concern
    if (value >= HEALTH_THRESHOLDS.BLOOD_SUGAR.MODERATE.min && 
        value <= HEALTH_THRESHOLDS.BLOOD_SUGAR.MODERATE.max) {
      concerns.push({
        id: `blood_sugar_${Date.now()}`,
        type: 'BLOOD_SUGAR',
        level: 'MODERATE',
        parameter: 'Random Blood Sugar',
        value,
        threshold: HEALTH_THRESHOLDS.BLOOD_SUGAR.MODERATE.max,
        recommendation: 'Lifestyle Counselling / Doctor consultation',
      });
    }

    // Check for high concern
    if (value >= HEALTH_THRESHOLDS.BLOOD_SUGAR.HIGH.min) {
      concerns.push({
        id: `blood_sugar_${Date.now()}`,
        type: 'BLOOD_SUGAR',
        level: 'HIGH',
        parameter: 'Random Blood Sugar',
        value,
        threshold: HEALTH_THRESHOLDS.BLOOD_SUGAR.HIGH.min,
        recommendation: 'MANDATORY Doctor Consultation',
      });
    }

    return concerns;
  }

  /**
   * Analyze blood pressure levels
   */
  private analyzeBloodPressure(healthCheckup: any): ConcernDto[] {
    const concerns: ConcernDto[] = [];
    
    // Extract from selected_test JSON
    const selectedTest = healthCheckup.selected_test;
    if (!selectedTest || !selectedTest.blood_pressure_unit) {
      return concerns; // Skip if missing
    }

    const bloodPressureData = selectedTest.blood_pressure_unit;
    if (!bloodPressureData.systolic_bp_unit?.value || !bloodPressureData.diastolic_bp_unit?.value) {
      return concerns; // Skip if missing systolic or diastolic
    }

    const systolic = parseFloat(bloodPressureData.systolic_bp_unit.value);
    const diastolic = parseFloat(bloodPressureData.diastolic_bp_unit.value);

    if (isNaN(systolic) || isNaN(diastolic)) {
      return concerns; // Skip if invalid values
    }

    // Check for moderate concern: 130-179 / 81-119 mmHg
    const isModerateSystolic = systolic >= 130 && systolic <= 179;
    const isModerateDiastolic = diastolic >= 81 && diastolic <= 119;

    if (isModerateSystolic || isModerateDiastolic) {
      concerns.push({
        id: `blood_pressure_${Date.now()}`,
        type: 'BLOOD_PRESSURE',
        level: 'MODERATE',
        parameter: 'Blood Pressure',
        value: `${systolic}/${diastolic}`,
        threshold: isModerateSystolic ? 'Systolic ≤179' : 'Diastolic ≤119',
        recommendation: 'Lifestyle Counselling / Doctor consultation',
      });
    }

    // Check for high concern: ≥180 / ≥120 mmHg
    const isHighSystolic = systolic >= 180;
    const isHighDiastolic = diastolic >= 120;

    if (isHighSystolic || isHighDiastolic) {
      concerns.push({
        id: `blood_pressure_${Date.now()}`,
        type: 'BLOOD_PRESSURE',
        level: 'HIGH',
        parameter: 'Blood Pressure',
        value: `${systolic}/${diastolic}`,
        threshold: isHighSystolic ? 'Systolic ≥180' : 'Diastolic ≥120',
        recommendation: 'MANDATORY Doctor Consultation',
      });
    }

    return concerns;
  }

  /**
   * Analyze pulse rate
   */
  private analyzePulse(healthCheckup: any): ConcernDto[] {
    const concerns: ConcernDto[] = [];
    
    // Extract from selected_test JSON
    const selectedTest = healthCheckup.selected_test;
    if (!selectedTest || !selectedTest.pulse_unit) {
      return concerns; // Skip if missing
    }

    const pulseData = selectedTest.pulse_unit;
    if (!pulseData.value) {
      return concerns; // Skip if no value
    }

    const value = parseFloat(pulseData.value);
    if (isNaN(value)) {
      return concerns; // Skip if invalid value
    }

    // Check for moderate concern: 101-119 OR 51-59 bpm
    const isModerateHigh = value >= 101 && value <= 119;
    const isModerateLow = value >= 51 && value <= 59;

    if (isModerateHigh || isModerateLow) {
      concerns.push({
        id: `pulse_${Date.now()}`,
        type: 'PULSE',
        level: 'MODERATE',
        parameter: 'Pulse Rate',
        value,
        threshold: isModerateHigh ? 119 : 59,
        recommendation: 'Lifestyle Counselling / Doctor consultation',
      });
    }

    // Check for high concern: >120 OR <50 bpm
    const isHighHigh = value > 120;
    const isHighLow = value < 50;

    if (isHighHigh || isHighLow) {
      concerns.push({
        id: `pulse_${Date.now()}`,
        type: 'PULSE',
        level: 'HIGH',
        parameter: 'Pulse Rate',
        value,
        threshold: isHighHigh ? 120 : 50,
        recommendation: 'MANDATORY Doctor Consultation',
      });
    }

    return concerns;
  }

  /**
   * Analyze hemoglobin levels
   */
  private analyzeHemoglobin(healthCheckup: any): ConcernDto[] {
    const concerns: ConcernDto[] = [];
    
    // Extract from selected_test JSON
    const selectedTest = healthCheckup.selected_test;
    if (!selectedTest || !selectedTest.haemoglobin_unit) {
      return concerns; // Skip if missing
    }

    const hemoglobinData = selectedTest.haemoglobin_unit;
    if (!hemoglobinData.value) {
      return concerns; // Skip if no value
    }

    const value = parseFloat(hemoglobinData.value);
    if (isNaN(value)) {
      return concerns; // Skip if invalid value
    }

    // Check for high concern: <8 g/dL
    if (value < 8) {
      concerns.push({
        id: `hemoglobin_${Date.now()}`,
        type: 'HEMOGLOBIN',
        level: 'HIGH',
        parameter: 'Hemoglobin',
        value,
        threshold: 8,
        recommendation: 'MANDATORY Doctor Consultation',
      });
    }

    return concerns;
  }

  /**
   * Analyze eye vision
   */
  private analyzeEyeVision(healthCheckup: any): ConcernDto[] {
    const concerns: ConcernDto[] = [];
    
    // Extract from selected_test JSON
    const selectedTest = healthCheckup.selected_test;
    if (!selectedTest || !selectedTest.eye_unit) {
      return concerns; // Skip if missing
    }

    const eyeData = selectedTest.eye_unit;
    
    // Check for 6/60 vision in either eye
    // Based on the JSON structure, we need to check the vision values
    // This is a simplified check - you may need to adjust based on actual data structure
    
    // Check if any eye has 6/60 vision
    const hasPoorVision = this.checkForPoorVision(eyeData);
    
    if (hasPoorVision) {
      concerns.push({
        id: `eye_vision_${Date.now()}`,
        type: 'EYE_VISION',
        level: 'HIGH',
        parameter: 'Eye Vision',
        value: '6/60',
        threshold: '6/60',
        recommendation: 'MANDATORY Doctor Consultation',
      });
    }

    return concerns;
  }

  /**
   * Check for poor vision (6/60) in eye data
   */
  private checkForPoorVision(eyeData: any): boolean {
    // This is a placeholder implementation
    // You need to implement based on your actual eye vision data structure
    // For example, if you have vision acuity values, check if any is 6/60
    
    // Example implementation (adjust based on your data structure):
    // if (eyeData.left_eye_vision === '6/60' || eyeData.right_eye_vision === '6/60') {
    //   return true;
    // }
    
    return false; // Placeholder - implement based on actual data structure
  }

  /**
   * Filter health checkup records and return grouped, classified test data
   */
  async filterHealthAnalysis(
    filterDto: FilterHealthAnalysisDto,
  ): Promise<FilterHealthAnalysisResponseDto> {
    this.driverInfoCache.clear();
    const startDate = new Date(filterDto.startDate);
    const endDate = new Date(filterDto.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (startDate > endDate) {
      throw new Error('startDate must be before or equal to endDate');
    }

    const whereClause: any = {
      createdAt: {
        [Op.between]: [startDate, endDate],
      },
    };

    // If centerId is provided, use it directly
    if (filterDto.centerId) {
      whereClause.createdBy = filterDto.centerId;
    } else if (filterDto.corporateId) {
      // If corporateId is provided, fetch the corporate and use its center_ids
      const corporate = await this.corporateModel.findByPk(filterDto.corporateId);
      
      if (!corporate) {
        throw new NotFoundException(`Corporate with ID ${filterDto.corporateId} not found`);
      }

      if (corporate.center_ids && corporate.center_ids.length > 0) {
        whereClause.createdBy = {
          [Op.in]: corporate.center_ids,
        };
      } else {
        // If corporate has no center_ids, return empty result
        return {
          success: true,
          tests: [],
          totalRecords: 0,
        };
      }
    }

    const healthCheckups = await this.driverHealthCheckupModel.findAll({
      where: whereClause,
      include: [
        {
          model: this.driverMasterModel,
          as: 'driver',
          required: true,
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    if (healthCheckups.length === 0) {
      return {
        success: true,
        tests: [],
        totalRecords: 0,
      };
    }

    const testGroups = this.processHealthCheckups(healthCheckups);

    return {
      success: true,
      tests: testGroups,
      totalRecords: healthCheckups.length,
    };
  }

  /**
   * Process health checkups and group by test and color category
   */
  private processHealthCheckups(healthCheckups: driverhealthcheckup[]): TestGroupDto[] {
    const testMap = new Map<string, Map<string, Map<number, TestDataPointDto[]>>>();

    for (const checkup of healthCheckups) {
      if (!checkup.driver) {
        continue;
      }

      const selectedTest = this.parseSelectedTest(checkup.selected_test);
      if (!selectedTest || typeof selectedTest !== 'object') {
        continue;
      }

      const checkupDate = checkup.createdAt
        ? new Date(checkup.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      this.storeDriverInfo(
        checkup.driver.id,
        checkup.driver.name || 'Unknown',
        checkup.driver.external_id || '',
      );
      this.extractTestData(
        selectedTest,
        checkup.driver.id,
        checkup.driver.name || 'Unknown',
        checkup.driver.external_id || '',
        checkupDate,
        testMap,
      );
    }

    return this.buildTestGroups(testMap);
  }

  /**
   * Parse selected_test JSON
   */
  private parseSelectedTest(selectedTest: any): any {
    if (!selectedTest) {
      return null;
    }
    if (typeof selectedTest === 'string') {
      try {
        return JSON.parse(selectedTest);
      } catch (error) {
        return null;
      }
    }
    return selectedTest;
  }

  /**
   * Extract test data from selected_test JSON
   */
  private extractTestData(
    selectedTest: any,
    driverId: number,
    driverName: string,
    externalId: string,
    date: string,
    testMap: Map<string, Map<string, Map<number, TestDataPointDto[]>>>,
  ): void {
    const testMappings: Array<{ key: string; name: string; unit: string; valuePath: string[]; valuePath2?: string[] }> =
      [
        { key: 'temperature_unit', name: 'Temperature', unit: 'F', valuePath: ['value'] },
        { key: 'spo2_unit', name: 'SpO2', unit: '%', valuePath: ['value'] },
        {
          key: 'random_blood_sugar_unit',
          name: 'Random Blood Sugar',
          unit: 'mg/dL',
          valuePath: ['value'],
        },
        { key: 'pulse_unit', name: 'Pulse', unit: 'bpm', valuePath: ['value'] },
        {
          key: 'pulmonary_function_test',
          name: 'Pulmonary Function Test',
          unit: 'L/min',
          valuePath: ['value'],
        },
        { key: 'haemoglobin_unit', name: 'Hemoglobin', unit: 'g/dL', valuePath: ['value'] },
        { key: 'bmi_unit', name: 'BMI', unit: 'kg/m²', valuePath: ['value'] },
        {
          key: 'blood_pressure_unit',
          name: 'Blood Pressure',
          unit: 'mm Hg',
          valuePath: ['systolic_bp_unit', 'value'],
          valuePath2: ['diastolic_bp_unit', 'value'],
        },
        { key: 'alcohol_test', name: 'Alcohol Test', unit: 'mg/100mL', valuePath: ['value'] },
        { key: 'eye_unit', name: 'Vision', unit: 'N/A', valuePath: ['value'] },
        { key: 'hearing_unit', name: 'Basic Hearing', unit: 'N/A', valuePath: ['value'] },
        { key: 'ecg_unit', name: 'ECG Test', unit: 'N/A', valuePath: ['value'] },
        { key: 'romberg_test', name: 'Romberg Test', unit: 'N/A', valuePath: ['value'] },
        { key: 'colour_blindness', name: 'Colour Blindness', unit: 'N/A', valuePath: ['value'] },
        { key: 'hiv_test', name: 'HIV Test', unit: 'N/A', valuePath: ['value'] },
      ];

    for (const mapping of testMappings) {
      const testData = selectedTest[mapping.key];
      if (!testData) {
        continue;
      }

      if (mapping.key === 'blood_pressure_unit') {
        const systolic = this.getNestedValue(testData, mapping.valuePath);
        const diastolic = this.getNestedValue(testData, mapping.valuePath2 || []);
        if (systolic !== null && systolic !== undefined && diastolic !== null && diastolic !== undefined) {
          const bpValue = `${systolic}/${diastolic}`;
          const systolicCategory = classifyParameter('BP-Systolic', systolic);
          const diastolicCategory = classifyParameter('BP-Diastolic', diastolic);
          const category = this.getHighestCategory(systolicCategory, diastolicCategory);
          this.addTestDataPoint(testMap, mapping.name, mapping.unit, driverId, date, bpValue, category);
        }
      } else {
        const value = this.getNestedValue(testData, mapping.valuePath);
        if (value !== null && value !== undefined && value !== '') {
          const category = classifyParameter(mapping.name, value, mapping.unit);
          this.addTestDataPoint(testMap, mapping.name, mapping.unit, driverId, date, value, category);
        }
      }
    }

    this.extractEyeTests(selectedTest, driverId, driverName, externalId, date, testMap);
  }

  /**
   * Extract eye-specific tests (Spherical, Cylindrical for both eyes)
   */
  private extractEyeTests(
    selectedTest: any,
    driverId: number,
    driverName: string,
    externalId: string,
    date: string,
    testMap: Map<string, Map<string, Map<number, TestDataPointDto[]>>>,
  ): void {
    const eyeUnit = selectedTest.eye_unit;
    if (!eyeUnit) {
      return;
    }

    const eyeTests = [
      { key: 'spherical_right', name: 'Spherical (Right Eye)', unit: 'D' },
      { key: 'cylindrical_right', name: 'Cylindrical (Right Eye)', unit: 'D' },
      { key: 'spherical_left', name: 'Spherical (Left Eye)', unit: 'D' },
      { key: 'cylindrical_left', name: 'Cylindrical (Left Eye)', unit: 'D' },
    ];

    for (const test of eyeTests) {
      const value = eyeUnit[test.key];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          const category = classifyParameter(test.name, numValue, test.unit);
          this.addTestDataPoint(testMap, test.name, test.unit, driverId, date, numValue, category);
        }
      }
    }
  }

  /**
   * Get nested value from object using path array
   */
  private getNestedValue(obj: any, path: string[]): any {
    let current = obj;
    for (const key of path) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[key];
    }
    return current;
  }

  /**
   * Add test data point to the test map
   */
  private addTestDataPoint(
    testMap: Map<string, Map<string, Map<number, TestDataPointDto[]>>>,
    testName: string,
    unit: string,
    driverId: number,
    date: string,
    value: any,
    category: 'red' | 'amber' | 'yellow' | 'green',
  ): void {
    if (!testMap.has(testName)) {
      testMap.set(testName, new Map());
    }

    const categoryMap = testMap.get(testName)!;
    if (!categoryMap.has(category)) {
      categoryMap.set(category, new Map());
    }

    const driverMap = categoryMap.get(category)!;
    if (!driverMap.has(driverId)) {
      driverMap.set(driverId, []);
    }

    const dataPoint: TestDataPointDto = {
      date,
      value,
      colorCategory: category,
    };

    driverMap.get(driverId)!.push(dataPoint);
  }

  /**
   * Get highest concern category between two categories
   */
  private getHighestCategory(
    cat1: 'red' | 'amber' | 'yellow' | 'green',
    cat2: 'red' | 'amber' | 'yellow' | 'green',
  ): 'red' | 'amber' | 'yellow' | 'green' {
    const priority = { red: 4, amber: 3, yellow: 2, green: 1 };
    return priority[cat1] >= priority[cat2] ? cat1 : cat2;
  }

  /**
   * Get color category for a test value (for driver test history response).
   * Handles Blood Pressure (systolic/diastolic) by taking the higher severity.
   */
  private getColorCategoryForTestValue(
    testName: string,
    value: any,
    unit: string,
  ): 'red' | 'amber' | 'yellow' | 'green' {
    if (testName === 'Blood Pressure' && typeof value === 'string') {
      const parts = value.split('/');
      if (parts.length === 2) {
        const systolic = parseFloat(parts[0].trim());
        const diastolic = parseFloat(parts[1].trim());
        if (!isNaN(systolic) && !isNaN(diastolic)) {
          const systolicCat = classifyParameter('BP-Systolic', systolic, unit);
          const diastolicCat = classifyParameter('BP-Diastolic', diastolic, unit);
          return this.getHighestCategory(systolicCat, diastolicCat);
        }
      }
    }
    return classifyParameter(testName, value, unit);
  }

  /**
   * Build test groups from the processed data
   */
  private buildTestGroups(
    testMap: Map<string, Map<string, Map<number, TestDataPointDto[]>>>,
  ): TestGroupDto[] {
    const testGroups: TestGroupDto[] = [];
    const unitMap = this.getTestUnitMap();

    for (const [testName, categoryMap] of testMap.entries()) {
      const unit = unitMap.get(testName) || 'N/A';
      const totalRecords = this.countTotalRecords(categoryMap);
      const colorCategoryAverages = this.calculateColorCategoryAverages(categoryMap, totalRecords);
      const colorCategories = this.buildColorCategories(categoryMap, testName);

      testGroups.push({
        testName,
        unit,
        colorCategoryAverages,
        colorCategories,
      });
    }

    return testGroups.sort((a, b) => a.testName.localeCompare(b.testName));
  }

  /**
   * Get test unit mapping
   */
  private getTestUnitMap(): Map<string, string> {
    return new Map([
      ['Temperature', 'F'],
      ['SpO2', '%'],
      ['Random Blood Sugar', 'mg/dL'],
      ['Pulse', 'bpm'],
      ['Pulmonary Function Test', 'L/min'],
      ['Hemoglobin', 'g/dL'],
      ['BMI', 'kg/m²'],
      ['Blood Pressure', 'mm Hg'],
      ['Alcohol Test', 'mg/100mL'],
      ['Vision', 'N/A'],
      ['Spherical (Right Eye)', 'D'],
      ['Cylindrical (Right Eye)', 'D'],
      ['Spherical (Left Eye)', 'D'],
      ['Cylindrical (Left Eye)', 'D'],
      ['Basic Hearing', 'N/A'],
      ['ECG Test', 'N/A'],
      ['Romberg Test', 'N/A'],
      ['Colour Blindness', 'N/A'],
      ['HIV Test', 'N/A'],
    ]);
  }

  /**
   * Count total records across all categories
   */
  private countTotalRecords(
    categoryMap: Map<string, Map<number, TestDataPointDto[]>>,
  ): number {
    let total = 0;
    for (const driverMap of categoryMap.values()) {
      for (const dataPoints of driverMap.values()) {
        total += dataPoints.length;
      }
    }
    return total;
  }

  /**
   * Calculate color category averages (percentages)
   */
  private calculateColorCategoryAverages(
    categoryMap: Map<string, Map<number, TestDataPointDto[]>>,
    totalRecords: number,
  ): ColorCategoryAveragesDto {
    if (totalRecords === 0) {
      return { red: 0, amber: 0, yellow: 0, green: 0 };
    }

    const counts = {
      red: 0,
      amber: 0,
      yellow: 0,
      green: 0,
    };

    for (const [category, driverMap] of categoryMap.entries()) {
      for (const dataPoints of driverMap.values()) {
        counts[category as keyof typeof counts] += dataPoints.length;
      }
    }

    return {
      red: Number(((counts.red / totalRecords) * 100).toFixed(2)),
      amber: Number(((counts.amber / totalRecords) * 100).toFixed(2)),
      yellow: Number(((counts.yellow / totalRecords) * 100).toFixed(2)),
      green: Number(((counts.green / totalRecords) * 100).toFixed(2)),
    };
  }

  /**
   * Build color categories with driver data
   */
  private buildColorCategories(
    categoryMap: Map<string, Map<number, TestDataPointDto[]>>,
    testName: string,
  ): ColorCategoriesDto {
    const categories: ColorCategoriesDto = {
      red: { drivers: [] },
      amber: { drivers: [] },
      yellow: { drivers: [] },
      green: { drivers: [] },
    };

    for (const [category, driverMap] of categoryMap.entries()) {
      const drivers: DriverCategoryDataDto[] = [];

      for (const [driverId, dataPoints] of driverMap.entries()) {
        const driver = this.getDriverInfo(driverId);
        if (!driver) {
          continue;
        }

        const numericValues = dataPoints
          .map((dp) => {
            const val = typeof dp.value === 'string' ? parseFloat(dp.value) : dp.value;
            return isNaN(val) ? null : val;
          })
          .filter((v) => v !== null) as number[];

        const average = numericValues.length > 0 ? this.calculateAverage(numericValues) : null;

        drivers.push({
          driverId,
          driverName: driver.name,
          externalId: driver.externalId,
          data: dataPoints,
          average,
        });
      }

      categories[category as keyof ColorCategoriesDto] = { drivers };
    }

    return categories;
  }

  /**
   * Get driver info (this would ideally come from a cache or the included relation)
   * For now, we'll need to fetch it or store it during processing
   */
  private driverInfoCache = new Map<number, { name: string; externalId: string }>();

  private getDriverInfo(driverId: number): { name: string; externalId: string } | null {
    return this.driverInfoCache.get(driverId) || null;
  }

  /**
   * Store driver info in cache during processing
   */
  private storeDriverInfo(driverId: number, name: string, externalId: string): void {
    this.driverInfoCache.set(driverId, { name, externalId });
  }

  /**
   * Calculate average of numeric values
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0;
    }
    const sum = values.reduce((acc, val) => acc + val, 0);
    return Number((sum / values.length).toFixed(2));
  }

  /**
   * Parse monthWithYear string to get start and end dates for the month
   * Supports formats like "Jan 2026", "January 2026", "jan 2026", etc.
   */
  private parseMonthWithYear(monthWithYear: string): { startDate: Date; endDate: Date } {
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const monthNamesShort = [
      'jan', 'feb', 'mar', 'apr', 'may', 'jun',
      'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
    ];

    const parts = monthWithYear.trim().split(/\s+/);

    if (parts.length !== 2) {
      throw new BadRequestException(`Invalid monthWithYear format: ${monthWithYear}. Expected format: "Jan 2026" or "January 2026"`);
    }

    const monthStr = parts[0].toLowerCase();
    const yearStr = parts[1];

    let monthIndex = monthNamesShort.indexOf(monthStr);
    if (monthIndex === -1) {
      monthIndex = monthNames.indexOf(monthStr);
    }

    if (monthIndex === -1) {
      throw new BadRequestException(`Invalid month name: ${parts[0]}`);
    }

    const year = parseInt(yearStr, 10);
    if (isNaN(year) || year < 1900 || year > 2100) {
      throw new BadRequestException(`Invalid year: ${yearStr}`);
    }

    const startDate = new Date(year, monthIndex, 1, 0, 0, 0, 0);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);

    return { startDate, endDate };
  }

  /**
   * Fetch organization start date from Users table
   */
  private async getOrganizationStartDate(userId: number): Promise<Date> {
    const user = await this.userModel.findByPk(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.createdAt) {
      throw new BadRequestException(`User with ID ${userId} does not have a createdAt date`);
    }

    return new Date(user.createdAt);
  }

  /**
   * Get the oldest health checkup record date for given center IDs
   */
  private async getOldestHealthCheckupDate(centerIds: number[]): Promise<Date> {
    if (!centerIds || centerIds.length === 0) {
      throw new BadRequestException('Center IDs array cannot be empty');
    }

    const oldestRecord = await this.driverHealthCheckupModel.findOne({
      where: {
        createdBy: {
          [Op.in]: centerIds,
        },
      },
      order: [['createdAt', 'ASC']],
      attributes: ['createdAt'],
    });

    if (!oldestRecord || !oldestRecord.createdAt) {
      throw new NotFoundException(`No health checkup records found for the provided center IDs: ${centerIds.join(', ')}`);
    }

    return new Date(oldestRecord.createdAt);
  }

  /**
   * Calculate Cohort 2 date range
   */
  private calculateCohort2DateRange(
    cohort1StartDate: Date,
    organizationStartDate: Date,
    monthsBack: number,
  ): { startDate: Date; endDate: Date } {
    // Calculate Cohort 2 end date: Cohort 1 start date minus monthsBack months
    const cohort2EndDate = new Date(cohort1StartDate);
    cohort2EndDate.setMonth(cohort2EndDate.getMonth() - monthsBack);
    cohort2EndDate.setDate(0); // Last day of the previous month
    cohort2EndDate.setHours(23, 59, 59, 999);

    // Cohort 2 start date is the organization start date
    const cohort2StartDate = new Date(organizationStartDate);
    cohort2StartDate.setHours(0, 0, 0, 0);

    if (cohort2StartDate > cohort2EndDate) {
      throw new BadRequestException(
        `Organization start date (${cohort2StartDate.toISOString()}) is after Cohort 2 end date (${cohort2EndDate.toISOString()})`,
      );
    }

    return { startDate: cohort2StartDate, endDate: cohort2EndDate };
  }

  /**
   * Process cohort records and count unique patients per test parameter and color category
   * Each driver is counted only once per test parameter in their highest priority category
   * Priority: red > amber > yellow > green
   */
  private processCohortForPatientCounts(
    healthCheckups: driverhealthcheckup[],
  ): Map<string, Map<string, Set<number>>> {
    // Structure: testName -> colorCategory -> Set of driverIds
    const testCategoryMap = new Map<string, Map<string, Set<number>>>();
    // Track which category each driver is assigned to per test (to ensure one category per driver per test)
    const driverTestCategory = new Map<string, 'red' | 'amber' | 'yellow' | 'green'>();
    const categoryPriority = { red: 4, amber: 3, yellow: 2, green: 1 };

    for (const checkup of healthCheckups) {
      if (!checkup.driver_id) {
        continue;
      }

      const selectedTest = this.parseSelectedTest(checkup.selected_test);
      if (!selectedTest || typeof selectedTest !== 'object') {
        continue;
      }

      // Extract test data similar to extractTestData method
      const testMappings: Array<{
        key: string;
        name: string;
        unit: string;
        valuePath: string[];
        valuePath2?: string[];
      }> = [
        { key: 'temperature_unit', name: 'Temperature', unit: 'F', valuePath: ['value'] },
        { key: 'spo2_unit', name: 'SpO2', unit: '%', valuePath: ['value'] },
        {
          key: 'random_blood_sugar_unit',
          name: 'Random Blood Sugar',
          unit: 'mg/dL',
          valuePath: ['value'],
        },
        { key: 'pulse_unit', name: 'Pulse', unit: 'bpm', valuePath: ['value'] },
        {
          key: 'pulmonary_function_test',
          name: 'Pulmonary Function Test',
          unit: 'L/min',
          valuePath: ['value'],
        },
        { key: 'haemoglobin_unit', name: 'Hemoglobin', unit: 'g/dL', valuePath: ['value'] },
        { key: 'bmi_unit', name: 'BMI', unit: 'kg/m²', valuePath: ['value'] },
        {
          key: 'blood_pressure_unit',
          name: 'Blood Pressure',
          unit: 'mm Hg',
          valuePath: ['systolic_bp_unit', 'value'],
          valuePath2: ['diastolic_bp_unit', 'value'],
        },
        { key: 'alcohol_test', name: 'Alcohol Test', unit: 'mg/100mL', valuePath: ['value'] },
        { key: 'eye_unit', name: 'Vision', unit: 'N/A', valuePath: ['value'] },
        { key: 'hearing_unit', name: 'Basic Hearing', unit: 'N/A', valuePath: ['value'] },
        { key: 'ecg_unit', name: 'ECG Test', unit: 'N/A', valuePath: ['value'] },
        { key: 'romberg_test', name: 'Romberg Test', unit: 'N/A', valuePath: ['value'] },
        { key: 'colour_blindness', name: 'Colour Blindness', unit: 'N/A', valuePath: ['value'] },
        { key: 'hiv_test', name: 'HIV Test', unit: 'N/A', valuePath: ['value'] },
      ];

      for (const mapping of testMappings) {
        const testData = selectedTest[mapping.key];
        if (!testData) {
          continue;
        }

        let category: 'red' | 'amber' | 'yellow' | 'green';

        if (mapping.key === 'blood_pressure_unit') {
          const systolic = this.getNestedValue(testData, mapping.valuePath);
          const diastolic = this.getNestedValue(testData, mapping.valuePath2 || []);
          if (
            systolic !== null &&
            systolic !== undefined &&
            diastolic !== null &&
            diastolic !== undefined
          ) {
            const systolicCategory = classifyParameter('BP-Systolic', systolic);
            const diastolicCategory = classifyParameter('BP-Diastolic', diastolic);
            category = this.getHighestCategory(systolicCategory, diastolicCategory);
          } else {
            continue;
          }
        } else {
          const value = this.getNestedValue(testData, mapping.valuePath);
          if (value === null || value === undefined || value === '') {
            continue;
          }
          category = classifyParameter(mapping.name, value, mapping.unit);
        }

        // Create unique key for driver-test combination
        const driverTestKey = `${checkup.driver_id}_${mapping.name}`;
        const existingCategory = driverTestCategory.get(driverTestKey);

        // Only assign driver to this category if:
        // 1. Driver hasn't been assigned to this test yet, OR
        // 2. Current category has higher priority than existing category
        if (
          !existingCategory ||
          categoryPriority[category] > categoryPriority[existingCategory]
        ) {
          // Remove driver from previous category if exists
          if (existingCategory) {
            const prevCategoryMap = testCategoryMap.get(mapping.name)?.get(existingCategory);
            prevCategoryMap?.delete(checkup.driver_id);
          }

          // Initialize maps if needed
          if (!testCategoryMap.has(mapping.name)) {
            testCategoryMap.set(mapping.name, new Map());
          }
          const categoryMap = testCategoryMap.get(mapping.name)!;
          if (!categoryMap.has(category)) {
            categoryMap.set(category, new Set());
          }

          // Add driver ID to the new category
          categoryMap.get(category)!.add(checkup.driver_id);
          driverTestCategory.set(driverTestKey, category);
        }
      }

      // Handle eye-specific tests
      this.processEyeTestsForCohortWithPriority(selectedTest, checkup.driver_id, testCategoryMap, driverTestCategory);
    }

    return testCategoryMap;
  }

  /**
   * Process eye-specific tests for cohort analysis with priority handling
   */
  private processEyeTestsForCohortWithPriority(
    selectedTest: any,
    driverId: number,
    testCategoryMap: Map<string, Map<string, Set<number>>>,
    driverTestCategory: Map<string, 'red' | 'amber' | 'yellow' | 'green'>,
  ): void {
    const eyeUnit = selectedTest.eye_unit;
    if (!eyeUnit) {
      return;
    }

    const categoryPriority = { red: 4, amber: 3, yellow: 2, green: 1 };
    const eyeTests = [
      { key: 'spherical_right', name: 'Spherical (Right Eye)', unit: 'D' },
      { key: 'cylindrical_right', name: 'Cylindrical (Right Eye)', unit: 'D' },
      { key: 'spherical_left', name: 'Spherical (Left Eye)', unit: 'D' },
      { key: 'cylindrical_left', name: 'Cylindrical (Left Eye)', unit: 'D' },
    ];

    for (const test of eyeTests) {
      const value = eyeUnit[test.key];
      if (value !== null && value !== undefined && value !== '') {
        const numValue = typeof value === 'string' ? parseFloat(value) : value;
        if (!isNaN(numValue)) {
          const category = classifyParameter(test.name, numValue, test.unit);
          const driverTestKey = `${driverId}_${test.name}`;
          const existingCategory = driverTestCategory.get(driverTestKey);

          // Only assign driver to this category if higher priority
          if (
            !existingCategory ||
            categoryPriority[category] > categoryPriority[existingCategory]
          ) {
            // Remove driver from previous category if exists
            if (existingCategory) {
              const prevCategoryMap = testCategoryMap.get(test.name)?.get(existingCategory);
              prevCategoryMap?.delete(driverId);
            }

            if (!testCategoryMap.has(test.name)) {
              testCategoryMap.set(test.name, new Map());
            }
            const categoryMap = testCategoryMap.get(test.name)!;
            if (!categoryMap.has(category)) {
              categoryMap.set(category, new Set());
            }
            categoryMap.get(category)!.add(driverId);
            driverTestCategory.set(driverTestKey, category);
          }
        }
      }
    }
  }

  /**
   * Get test unit mapping
   */
  private getTestUnitForCohort(testName: string): string {
    const unitMap = this.getTestUnitMap();
    return unitMap.get(testName) || 'N/A';
  }

  /**
   * Find common driver IDs between two cohorts using optimized SQL query
   */
  private async findCommonDriverIds(
    cohort1WhereClause: any,
    cohort2WhereClause: any,
  ): Promise<Set<number>> {
    // Build replacements object for cohort 1
    const cohort1Replacements: any = {
      cohort1Start: cohort1WhereClause.createdAt[Op.between][0],
      cohort1End: cohort1WhereClause.createdAt[Op.between][1],
    };
    let cohort1Sql = `SELECT DISTINCT driver_id 
       FROM driverhealthcheckups 
       WHERE driver_id IS NOT NULL 
       AND "createdAt" BETWEEN :cohort1Start AND :cohort1End`;
    
    if (cohort1WhereClause.createdBy) {
      const centerIds = cohort1WhereClause.createdBy[Op.in] || 
                       (Array.isArray(cohort1WhereClause.createdBy) ? cohort1WhereClause.createdBy : [cohort1WhereClause.createdBy]);
      
      if (centerIds.length === 1) {
        cohort1Sql += ' AND "createdBy" = :cohort1CenterId';
        cohort1Replacements.cohort1CenterId = centerIds[0];
      } else if (centerIds.length > 1) {
        // Build IN clause with individual placeholders for better compatibility
        const placeholders = centerIds.map((_: any, idx: number) => `:cohort1CenterId${idx}`).join(', ');
        cohort1Sql += ` AND "createdBy" IN (${placeholders})`;
        centerIds.forEach((id: number, idx: number) => {
          cohort1Replacements[`cohort1CenterId${idx}`] = id;
        });
      }
    }

    // Build replacements object for cohort 2
    const cohort2Replacements: any = {
      cohort2Start: cohort2WhereClause.createdAt[Op.between][0],
      cohort2End: cohort2WhereClause.createdAt[Op.between][1],
    };
    let cohort2Sql = `SELECT DISTINCT driver_id 
       FROM driverhealthcheckups 
       WHERE driver_id IS NOT NULL 
       AND "createdAt" BETWEEN :cohort2Start AND :cohort2End`;
    
    if (cohort2WhereClause.createdBy) {
      const centerIds = cohort2WhereClause.createdBy[Op.in] || 
                       (Array.isArray(cohort2WhereClause.createdBy) ? cohort2WhereClause.createdBy : [cohort2WhereClause.createdBy]);
      
      if (centerIds.length === 1) {
        cohort2Sql += ' AND "createdBy" = :cohort2CenterId';
        cohort2Replacements.cohort2CenterId = centerIds[0];
      } else if (centerIds.length > 1) {
        // Build IN clause with individual placeholders for better compatibility
        const placeholders = centerIds.map((_: any, idx: number) => `:cohort2CenterId${idx}`).join(', ');
        cohort2Sql += ` AND "createdBy" IN (${placeholders})`;
        centerIds.forEach((id: number, idx: number) => {
          cohort2Replacements[`cohort2CenterId${idx}`] = id;
        });
      }
    }

    // Execute queries in parallel
    const [cohort1Results, cohort2Results] = await Promise.all([
      this.driverHealthCheckupModel.sequelize!.query(cohort1Sql, {
        replacements: cohort1Replacements,
        type: 'SELECT' as const,
      }),
      this.driverHealthCheckupModel.sequelize!.query(cohort2Sql, {
        replacements: cohort2Replacements,
        type: 'SELECT' as const,
      }),
    ]);

    const cohort1DriverIds = new Set(
      (cohort1Results as any[]).map((r) => r.driver_id).filter((id) => id != null),
    );
    const cohort2DriverIds = new Set(
      (cohort2Results as any[]).map((r) => r.driver_id).filter((id) => id != null),
    );

    // Find intersection
    const commonDriverIds = new Set<number>();
    for (const driverId of cohort1DriverIds) {
      if (cohort2DriverIds.has(driverId)) {
        commonDriverIds.add(driverId);
      }
    }

    return commonDriverIds;
  }

  /**
   * Cohort Health Analysis - Compare two cohorts and return patient counts by test parameter and color category
   * 
   * OPTIMIZATION STRATEGY:
   * 1. Find common driver IDs first using optimized SQL queries (avoids fetching all records)
   * 2. Fetch only records for common drivers (reduces data transfer significantly)
   * 3. Select only required columns (id, driver_id, selected_test, createdAt) instead of all columns
   * 4. Remove unnecessary JOINs (no driver relation needed for processing)
   * 5. Process records in parallel where possible
   * 
   * This reduces query time from ~84 seconds to typically <5 seconds for large datasets.
   */
  async cohortHealthAnalysis(
    cohortDto: CohortHealthAnalysisDto,
  ): Promise<CohortHealthAnalysisResponseDto> {
    // 1. Parse monthWithYear to get Cohort 1 date range
    const cohort1Dates = this.parseMonthWithYear(cohortDto.monthWithYear);

    // 2. Determine center IDs and start date
    let centerIds: number[] = [];
    let startDate: Date;

    if (cohortDto.corporateId && !cohortDto.centerId) {
      // Fetch center IDs from Corporate table
      const corporate = await this.corporateModel.findByPk(cohortDto.corporateId);
      if (!corporate) {
        throw new NotFoundException(`Corporate with ID ${cohortDto.corporateId} not found`);
      }
      
      const corporateCenterIds = corporate.center_ids as number[] | null | undefined;
      if (!corporateCenterIds || corporateCenterIds.length === 0) {
        throw new BadRequestException(`Corporate with ID ${cohortDto.corporateId} has no center IDs`);
      }
      
      centerIds = corporateCenterIds;
      // Get oldest health checkup record date for these center IDs
      startDate = await this.getOldestHealthCheckupDate(centerIds);
    } else {
      // Use the provided center ID directly
      centerIds = [cohortDto.centerId];
      // Get oldest health checkup record date for this center ID
      startDate = await this.getOldestHealthCheckupDate(centerIds);
    }

    // 3. Calculate Cohort 2 date range
    const cohort2Dates = this.calculateCohort2DateRange(
      cohort1Dates.startDate,
      startDate,
      cohortDto.monthsBack,
    );

    // 4. Build where clauses for both cohorts
    const cohort1WhereClause: any = {
      createdAt: {
        [Op.between]: [cohort1Dates.startDate, cohort1Dates.endDate],
      },
    };

    const cohort2WhereClause: any = {
      createdAt: {
        [Op.between]: [cohort2Dates.startDate, cohort2Dates.endDate],
      },
    };

    // Add center ID filters if provided
    if (centerIds.length > 0) {
      if (centerIds.length === 1) {
        cohort1WhereClause.createdBy = centerIds[0];
        cohort2WhereClause.createdBy = centerIds[0];
      } else {
        cohort1WhereClause.createdBy = {
          [Op.in]: centerIds,
        };
        cohort2WhereClause.createdBy = {
          [Op.in]: centerIds,
        };
      }
    }

    // 5. Find common driver IDs first (OPTIMIZATION: Use SQL to find common drivers efficiently)
    const commonDriverIds = await this.findCommonDriverIds(cohort1WhereClause, cohort2WhereClause);

    if (commonDriverIds.size === 0) {
      return {
        success: true,
        cohort1: {
          startDate: cohort1Dates.startDate.toISOString().split('T')[0],
          endDate: cohort1Dates.endDate.toISOString().split('T')[0],
          totalPatients: 0,
        },
        cohort2: {
          startDate: cohort2Dates.startDate.toISOString().split('T')[0],
          endDate: cohort2Dates.endDate.toISOString().split('T')[0],
          totalPatients: 0,
        },
        commonDriversCount: 0,
        tests: [],
      };
    }

    // 6. Build optimized where clauses with common driver filter
    const cohort1OptimizedWhere: any = {
      ...cohort1WhereClause,
      driver_id: {
        [Op.in]: Array.from(commonDriverIds),
      },
    };

    const cohort2OptimizedWhere: any = {
      ...cohort2WhereClause,
      driver_id: {
        [Op.in]: Array.from(commonDriverIds),
      },
    };

    // 7. Fetch only needed records with only required columns (OPTIMIZATION: Select only needed columns, no JOINs)
    const [cohort1Records, cohort2Records] = await Promise.all([
      this.driverHealthCheckupModel.findAll({
        where: cohort1OptimizedWhere,
        attributes: ['id', 'driver_id', 'selected_test', 'createdAt'], // Only fetch needed columns
        raw: false, // Keep as instances for JSON parsing
      }),
      this.driverHealthCheckupModel.findAll({
        where: cohort2OptimizedWhere,
        attributes: ['id', 'driver_id', 'selected_test', 'createdAt'], // Only fetch needed columns
        raw: false, // Keep as instances for JSON parsing
      }),
    ]);

    // 8. Process each cohort to get patient counts
    const cohort1Counts = this.processCohortForPatientCounts(cohort1Records);
    const cohort2Counts = this.processCohortForPatientCounts(cohort2Records);

    // 9. Get all unique test names from both cohorts
    const allTestNames = new Set<string>();
    cohort1Counts.forEach((_, testName) => allTestNames.add(testName));
    cohort2Counts.forEach((_, testName) => allTestNames.add(testName));

    // 10. Build response
    const tests: CohortTestDataDto[] = [];

    for (const testName of allTestNames) {
      const cohort1Categories = cohort1Counts.get(testName) || new Map<string, Set<number>>();
      const cohort2Categories = cohort2Counts.get(testName) || new Map<string, Set<number>>();

      // Collect all drivers that have this test in each cohort
      const collectAllDriversForTest = (categories: Map<string, Set<number>>): Set<number> => {
        const all = new Set<number>();
        const addCategory = (key: 'red' | 'amber' | 'yellow' | 'green') => {
          const set = categories.get(key);
          if (set) {
            for (const id of set) {
              all.add(id);
            }
          }
        };
        addCategory('red');
        addCategory('amber');
        addCategory('yellow');
        addCategory('green');
        return all;
      };

      const cohort1DriversForTest = collectAllDriversForTest(cohort1Categories);
      const cohort2DriversForTest = collectAllDriversForTest(cohort2Categories);

      // Determine drivers that have this test in BOTH cohorts
      const commonDriversForTest = new Set<number>();
      for (const driverId of cohort1DriversForTest) {
        if (cohort2DriversForTest.has(driverId)) {
          commonDriversForTest.add(driverId);
        }
      }

      const perTestCommonDriversCount = commonDriversForTest.size;

      // Helper to filter a color category's set to only common drivers
      const filterCategorySet = (
        categories: Map<string, Set<number>>,
        key: 'red' | 'amber' | 'yellow' | 'green',
      ): Set<number> => {
        const original = categories.get(key);
        if (!original || original.size === 0 || commonDriversForTest.size === 0) {
          return new Set<number>();
        }
        const filtered = new Set<number>();
        for (const id of original) {
          if (commonDriversForTest.has(id)) {
            filtered.add(id);
          }
        }
        return filtered;
      };

      // Build filtered category sets per cohort
      const cohort1RedSet = filterCategorySet(cohort1Categories, 'red');
      const cohort1AmberSet = filterCategorySet(cohort1Categories, 'amber');
      const cohort1YellowSet = filterCategorySet(cohort1Categories, 'yellow');
      const cohort1GreenSet = filterCategorySet(cohort1Categories, 'green');

      const cohort2RedSet = filterCategorySet(cohort2Categories, 'red');
      const cohort2AmberSet = filterCategorySet(cohort2Categories, 'amber');
      const cohort2YellowSet = filterCategorySet(cohort2Categories, 'yellow');
      const cohort2GreenSet = filterCategorySet(cohort2Categories, 'green');

      const cohort1CountsDto: CohortPatientCountDto = {
        red: cohort1RedSet.size,
        amber: cohort1AmberSet.size,
        yellow: cohort1YellowSet.size,
        green: cohort1GreenSet.size,
      };

      const cohort2CountsDto: CohortPatientCountDto = {
        red: cohort2RedSet.size,
        amber: cohort2AmberSet.size,
        yellow: cohort2YellowSet.size,
        green: cohort2GreenSet.size,
      };

      // Convert Sets to sorted arrays of driver IDs (after filtering)
      const getDriverIds = (categorySet: Set<number>): number[] => {
        return Array.from(categorySet).sort((a, b) => a - b);
      };

      const cohort1DriverIdsDto: CohortPatientDriverIdsDto = {
        red: getDriverIds(cohort1RedSet),
        amber: getDriverIds(cohort1AmberSet),
        yellow: getDriverIds(cohort1YellowSet),
        green: getDriverIds(cohort1GreenSet),
      };

      const cohort2DriverIdsDto: CohortPatientDriverIdsDto = {
        red: getDriverIds(cohort2RedSet),
        amber: getDriverIds(cohort2AmberSet),
        yellow: getDriverIds(cohort2YellowSet),
        green: getDriverIds(cohort2GreenSet),
      };

      tests.push({
        testName,
        unit: this.getTestUnitForCohort(testName),
        cohort1: cohort1CountsDto,
        cohort2: cohort2CountsDto,
        cohort1DriverIds: cohort1DriverIdsDto,
        cohort2DriverIds: cohort2DriverIdsDto,
        commonDriversCount: perTestCommonDriversCount,
      });
    }

    // Sort tests by name
    tests.sort((a, b) => a.testName.localeCompare(b.testName));

    // Calculate total unique patients per cohort (already filtered to common drivers)
    const cohort1UniquePatients = new Set(
      cohort1Records.map((r) => r.driver_id).filter((id) => id != null),
    );
    const cohort2UniquePatients = new Set(
      cohort2Records.map((r) => r.driver_id).filter((id) => id != null),
    );

    return {
      success: true,
      cohort1: {
        startDate: cohort1Dates.startDate.toISOString().split('T')[0],
        endDate: cohort1Dates.endDate.toISOString().split('T')[0],
        totalPatients: cohort1UniquePatients.size,
      },
      cohort2: {
        startDate: cohort2Dates.startDate.toISOString().split('T')[0],
        endDate: cohort2Dates.endDate.toISOString().split('T')[0],
        totalPatients: cohort2UniquePatients.size,
      },
      commonDriversCount: commonDriverIds.size,
      tests,
    };
  }

  /**
   * Get driver test history - Returns first and last test values for specified drivers
   */
  async getDriverTestHistory(
    dto: DriverTestHistoryDto,
  ): Promise<DriverTestHistoryResponseDto> {
    // Build where clause
    const whereClause: any = {
      driver_id: {
        [Op.in]: dto.driverIds,
      },
    };

    // Add center IDs filter if provided
    if (dto.centerIds && dto.centerIds.length > 0) {
      whereClause.createdBy = {
        [Op.in]: dto.centerIds,
      };
    }

    // Fetch all health checkups for the given driver IDs with related data
    const healthCheckups = await this.driverHealthCheckupModel.findAll({
      where: whereClause,
      include: [
        {
          model: this.driverMasterModel,
          as: 'driver',
          required: false,
        },
        {
          model: this.cetManagementModel,
          as: 'CETMANAGEMENT',
          required: false,
        },
        {
          model: this.centerModel,
          as: 'center',
          required: false,
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    // Group health checkups by driver ID
    const driverCheckupsMap = new Map<number, driverhealthcheckup[]>();
    for (const checkup of healthCheckups) {
      if (!checkup.driver_id) {
        continue;
      }
      if (!driverCheckupsMap.has(checkup.driver_id)) {
        driverCheckupsMap.set(checkup.driver_id, []);
      }
      driverCheckupsMap.get(checkup.driver_id)!.push(checkup);
    }

    // Get test mapping for the requested test name
    const testMapping = this.getTestMappingByName(dto.testName);
    if (!testMapping) {
      throw new BadRequestException(`Invalid test name: ${dto.testName}`);
    }

    // Fetch driver names and contact numbers for drivers that might not have checkups
    const driverIdsWithoutCheckups = dto.driverIds.filter(
      (id) => !driverCheckupsMap.has(id),
    );
    const driversMap = new Map<
      number,
      { name: string; contactNumber: string | null; healthCardNumber: string | null }
    >();
    
    if (driverIdsWithoutCheckups.length > 0) {
      const drivers = await this.driverMasterModel.findAll({
        where: {
          id: {
            [Op.in]: driverIdsWithoutCheckups,
          },
        },
        attributes: ['id', 'name', 'contactNumber', 'healthCardNumber'],
      });
      
      for (const driver of drivers) {
        driversMap.set(driver.id, {
          name: driver.name || 'Unknown',
          contactNumber: driver.contactNumber || null,
          healthCardNumber: driver.healthCardNumber || null,
        });
      }
    }

    // Process each driver
    const driverResults: DriverTestHistoryItemDto[] = [];

    for (const driverId of dto.driverIds) {
      const checkups = driverCheckupsMap.get(driverId) || [];
      
      if (checkups.length === 0) {
        // Driver has no health checkups, but try to get driver name and contact
        const driverInfo = driversMap.get(driverId);
        const driverName = driverInfo?.name || 'Unknown';
        const driverContactNumber = driverInfo?.contactNumber ?? null;
        const healthCardNumber = driverInfo?.healthCardNumber ?? null;
        driverResults.push({
          driverId,
          driverName,
          driverContactNumber,
          healthCardNumber,
          firstRecord: null,
          lastRecord: null,
          cetName: null,
          centerName: null,
        });
        continue;
      }

      // Filter checkups to only those where the specified test is registered (has a value)
      const checkupsWithTest = checkups.filter((c) => {
        const value = this.extractTestValue(c.selected_test, testMapping);
        return value !== null && value !== undefined;
      });

      // Get driver name, contact, and health card from first checkup or from driversMap
      const driverName =
        checkups[0].driver?.name || driversMap.get(driverId)?.name || 'Unknown';
      const driverContactNumber =
        (checkups[0].driver?.contactNumber ||
          driversMap.get(driverId)?.contactNumber) ??
        null;
      const healthCardNumber =
        (checkups[0].driver as any)?.healthCardNumber ||
        driversMap.get(driverId)?.healthCardNumber ||
        null;

      // First and last records are the first/last checkups where the test is registered (ordered by createdAt ASC)
      const firstCheckupWithTest = checkupsWithTest[0];
      const lastCheckupWithTest = checkupsWithTest.length > 0
        ? checkupsWithTest[checkupsWithTest.length - 1]
        : null;

      const firstTestValue = firstCheckupWithTest
        ? this.extractTestValue(firstCheckupWithTest.selected_test, testMapping)
        : null;
      const lastTestValue = lastCheckupWithTest
        ? this.extractTestValue(lastCheckupWithTest.selected_test, testMapping)
        : null;

      // Color categories for first and last values
      const firstColorCategory =
        firstTestValue != null
          ? this.getColorCategoryForTestValue(dto.testName, firstTestValue, testMapping.unit)
          : null;
      const lastColorCategory =
        lastTestValue != null
          ? this.getColorCategoryForTestValue(dto.testName, lastTestValue, testMapping.unit)
          : null;

      // CET and Center names from the last record where the test is registered
      const cetName = lastCheckupWithTest?.CETMANAGEMENT?.name || null;
      const centerName = lastCheckupWithTest?.center
        ? (lastCheckupWithTest.center.project_name ||
            lastCheckupWithTest.center.agency_name ||
            lastCheckupWithTest.center.client_name ||
            null)
        : null;

      driverResults.push({
        driverId,
        driverName,
        driverContactNumber,
        healthCardNumber,
        firstRecord: firstTestValue != null && firstCheckupWithTest && firstColorCategory != null
          ? {
              value: firstTestValue,
              date: firstCheckupWithTest.createdAt
                ? new Date(firstCheckupWithTest.createdAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              colorCategory: firstColorCategory,
            }
          : null,
        lastRecord: lastTestValue != null && lastCheckupWithTest && lastColorCategory != null
          ? {
              value: lastTestValue,
              date: lastCheckupWithTest.createdAt
                ? new Date(lastCheckupWithTest.createdAt).toISOString().split('T')[0]
                : new Date().toISOString().split('T')[0],
              colorCategory: lastColorCategory,
            }
          : null,
        cetName,
        centerName,
      });
    }

    return {
      success: true,
      testName: dto.testName,
      drivers: driverResults,
    };
  }

  /**
   * Get full test history for a single driver: all tests, all records, with color category per value.
   * Same semantics as driver-test-history (color logic, CET/Center from last record) but for every test and every record.
   */
  async getDriverFullTestHistory(
    driverId: number,
    centerIds?: number[],
  ): Promise<DriverFullTestHistoryResponseDto> {
    const driver = await this.driverMasterModel.findByPk(driverId, {
      attributes: ['id', 'name', 'contactNumber'],
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    const healthCheckupsAll = await this.driverHealthCheckupModel.findAll({
      where: { driver_id: driverId },
      order: [['createdAt', 'ASC']],
    });

    const driverInfo: DriverFullTestHistoryDriverDto = {
      driverId,
      driverName: driver.name || 'Unknown',
      driverContactNumber: driver.contactNumber ?? null,
    };

    if (healthCheckupsAll.length === 0) {
      return {
        success: true,
        driver: driverInfo,
        tests: [],
      };
    }

    const healthCheckupsFiltered =
      centerIds && centerIds.length > 0
        ? healthCheckupsAll.filter((c) => c.createdBy != null && centerIds.includes(c.createdBy))
        : healthCheckupsAll;

    const testRecordsMap = new Map<
      string,
      { unit: string; records: DriverFullTestRecordDto[] }
    >();
    const testRecordsBeforeFilterCount = new Map<string, number>();
    const allMappings = this.getAllTestMappings();

    for (const checkup of healthCheckupsAll) {
      const checkupDate = checkup.createdAt
        ? new Date(checkup.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      for (const mapping of allMappings) {
        const value = this.extractTestValue(checkup.selected_test, mapping);
        if (value === null || value === undefined) continue;

        const prev = testRecordsBeforeFilterCount.get(mapping.name) ?? 0;
        testRecordsBeforeFilterCount.set(mapping.name, prev + 1);
      }
    }

    for (const checkup of healthCheckupsFiltered) {
      const checkupDate = checkup.createdAt
        ? new Date(checkup.createdAt).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];

      for (const mapping of allMappings) {
        const value = this.extractTestValue(checkup.selected_test, mapping);
        if (value === null || value === undefined) continue;

        const colorCategory = this.getColorCategoryForTestValue(
          mapping.name,
          value,
          mapping.unit,
        );
        const record: DriverFullTestRecordDto = {
          date: checkupDate,
          value,
          colorCategory,
        };

        if (!testRecordsMap.has(mapping.name)) {
          testRecordsMap.set(mapping.name, { unit: mapping.unit, records: [] });
        }
        testRecordsMap.get(mapping.name)!.records.push(record);
      }
    }

    const tests: DriverFullTestItemDto[] = [];
    for (const [testName, { unit, records }] of testRecordsMap.entries()) {
      if (records.length > 0) {
        const trend = this.getColorTrend(records);
        const beforeCount = testRecordsBeforeFilterCount.get(testName) ?? records.length;
        const afterCount = records.length;
        const removedCount = Math.max(0, beforeCount - afterCount);

        tests.push({
          testName,
          unit,
          records,
          trend,
          difference: {
            beforeCount,
            afterCount,
            removedCount,
          },
        });
      }
    }
    tests.sort((a, b) => a.testName.localeCompare(b.testName));

    return {
      success: true,
      driver: driverInfo,
      tests,
    };
  }

  /**
   * Derive trend from first vs last color category for a test.
   * Severity: red (worst) > amber > yellow > green (best). Improve = last better than first, decline = last worse, consistent = same or single record.
   */
  private getColorTrend(records: DriverFullTestRecordDto[]): DriverFullTestTrend {
    if (records.length === 0) return 'consistent';
    const severity: Record<string, number> = { red: 4, amber: 3, yellow: 2, green: 1 };
    const first = severity[records[0].colorCategory] ?? 2;
    const last = severity[records[records.length - 1].colorCategory] ?? 2;
    if (last < first) return 'improve';
    if (last > first) return 'decline';
    return 'consistent';
  }

  /** ARGB fill colors for vital risk levels (ExcelJS uses AARRGGBB). */
  private static readonly COLOR_FILL: Record<string, { argb: string }> = {
    red: { argb: 'FFDC143C' },
    amber: { argb: 'FFFFA500' },
    yellow: { argb: 'FFFFFFE0' },
    green: { argb: 'FF90EE90' },
  };

  /**
   * Export XLSX of last vital values for given drivers. One row per driver; one column per vital with cell filled by color (no separate color column).
   * Legend at top: Red – Critical, Amber – Moderate Risk, Yellow – Low Risk, Green – Normal.
   * For each vital we use the last record (most recent checkup) that has that vital value; if none, 'N/A'.
   */
  async getDriversVitalsCsv(driverIds: number[]): Promise<Buffer> {
    if (!driverIds?.length) {
      throw new BadRequestException('driverIds must be a non-empty array');
    }
    const uniqueDriverIds = [...new Set(driverIds)];
    const drivers = await this.driverMasterModel.findAll({
      where: { id: { [Op.in]: uniqueDriverIds } },
      attributes: ['id', 'name', 'contactNumber'],
    });
    const driversMap = new Map(drivers.map((d) => [d.id, d]));

    const checkups = await this.driverHealthCheckupModel.findAll({
      where: { driver_id: { [Op.in]: uniqueDriverIds } },
      include: [
        { model: this.driverMasterModel, as: 'driver', required: false },
        { model: this.cetManagementModel, as: 'CETMANAGEMENT', required: false },
      ],
      order: [['createdAt', 'DESC']],
    });
    const checkupsByDriverId = new Map<number, typeof checkups>();
    for (const c of checkups) {
      if (c.driver_id != null) {
        if (!checkupsByDriverId.has(c.driver_id)) {
          checkupsByDriverId.set(c.driver_id, []);
        }
        checkupsByDriverId.get(c.driver_id)!.push(c);
      }
    }

    const mappings = this.getAllTestMappings();
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Drivers Vitals', { views: [{ state: 'frozen', ySplit: 6 }] });

    let rowIdx = 1;
    sheet.getRow(rowIdx).getCell(1).value = 'Color Code';
    sheet.getRow(rowIdx).getCell(1).font = { bold: true };
    rowIdx++;
    const legendRows: Array<{ label: string; color: string }> = [
      { label: 'Red – Critical Condition', color: 'red' },
      { label: 'Amber – Moderate Risk', color: 'amber' },
      { label: 'Yellow – Low Risk', color: 'yellow' },
      { label: 'Green – Normal Condition', color: 'green' },
    ];
    for (const { label, color } of legendRows) {
      const cell = sheet.getRow(rowIdx).getCell(1);
      cell.value = label;
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: HealthAnalysisService.COLOR_FILL[color],
      };
      rowIdx++;
    }
    rowIdx++;
    const headerCells = ['Patient Name', 'Patient ID', 'Phone Number', 'CET Name', ...mappings.map((m) => m.name)];
    const headerRow = sheet.getRow(rowIdx);
    headerCells.forEach((text, colIdx) => {
      headerRow.getCell(colIdx + 1).value = text;
      headerRow.getCell(colIdx + 1).font = { bold: true };
    });
    rowIdx++;

    for (const driverId of uniqueDriverIds) {
      const driver = driversMap.get(driverId);
      const driverCheckups = checkupsByDriverId.get(driverId) ?? [];
      const latestCheckup = driverCheckups[0] ?? null;
      const patientName = driver?.name ?? latestCheckup?.driver?.name ?? '';
      const phoneNumber = driver?.contactNumber ?? latestCheckup?.driver?.contactNumber ?? '';
      const cetName = latestCheckup?.CETMANAGEMENT?.name ?? '';

      const dataRow = sheet.getRow(rowIdx);
      dataRow.getCell(1).value = patientName;
      dataRow.getCell(2).value = driverId;
      dataRow.getCell(3).value = phoneNumber;
      dataRow.getCell(4).value = cetName;

      let colIdx = 5;
      for (const mapping of mappings) {
        let value: any = null;
        let colorCategory: 'red' | 'amber' | 'yellow' | 'green' | null = null;
        for (const c of driverCheckups) {
          const v = this.extractTestValue(c.selected_test, mapping);
          if (v !== null && v !== undefined && v !== '') {
            value = v;
            colorCategory = this.getColorCategoryForTestValue(mapping.name, value, mapping.unit);
            break;
          }
        }
        const cell = dataRow.getCell(colIdx);
        cell.value = value !== null && value !== undefined && value !== '' ? String(value) : 'N/A';
        if (colorCategory != null && HealthAnalysisService.COLOR_FILL[colorCategory]) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: HealthAnalysisService.COLOR_FILL[colorCategory],
          };
        }
        colIdx++;
      }
      rowIdx++;
    }

    sheet.columns.forEach((col, i) => {
      if (col) col.width = 16;
    });
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  /**
   * Get all test mappings (single source of truth for driver test history APIs).
   * Keys aligned with actual selected_test JSON (e.g. vision_unit, alchol_test_unit, romberg_unit).
   * alternativeKeys: fallback keys if primary key is missing (legacy/other formats).
   * altValuePath: fallback path for value (e.g. status when value is absent, e.g. Romberg).
   */
  private getAllTestMappings(): Array<{
    key: string;
    alternativeKeys?: string[];
    name: string;
    unit: string;
    valuePath: string[];
    valuePath2?: string[];
    altValuePath?: string[];
  }> {
    return [
      { key: 'temperature_unit', name: 'Temperature', unit: 'F', valuePath: ['value'] },
      { key: 'spo2_unit', name: 'SpO2', unit: '%', valuePath: ['value'] },
      {
        key: 'random_blood_sugar_unit',
        name: 'Random Blood Sugar',
        unit: 'mg/dL',
        valuePath: ['value'],
      },
      { key: 'pulse_unit', name: 'Pulse', unit: 'bpm', valuePath: ['value'] },
      {
        key: 'pulmonary_function_test',
        name: 'Pulmonary Function Test',
        unit: 'L/min',
        valuePath: ['value'],
      },
      { key: 'haemoglobin_unit', name: 'Hemoglobin', unit: 'g/dL', valuePath: ['value'] },
      { key: 'bmi_unit', name: 'BMI', unit: 'kg/m²', valuePath: ['value'] },
      {
        key: 'blood_pressure_unit',
        name: 'Blood Pressure',
        unit: 'mm Hg',
        valuePath: ['systolic_bp_unit', 'value'],
        valuePath2: ['diastolic_bp_unit', 'value'],
      },
      {
        key: 'alchol_test_unit',
        alternativeKeys: ['alcohol_test'],
        name: 'Alcohol Test',
        unit: 'mg/100mL',
        valuePath: ['value'],
      },
      {
        key: 'vision_unit',
        alternativeKeys: ['eye_unit'],
        name: 'Vision',
        unit: 'N/A',
        valuePath: ['value'],
      },
      { key: 'hearing_unit', name: 'Basic Hearing', unit: 'N/A', valuePath: ['value'] },
      { key: 'ecg_unit', name: 'ECG Test', unit: 'N/A', valuePath: ['value'] },
      {
        key: 'romberg_unit',
        alternativeKeys: ['romberg_test'],
        name: 'Romberg Test',
        unit: 'N/A',
        valuePath: ['value'],
        altValuePath: ['status'],
      },
      { key: 'colour_blindness', name: 'Colour Blindness', unit: 'N/A', valuePath: ['value'] },
      { key: 'hiv_test', name: 'HIV Test', unit: 'N/A', valuePath: ['value'] },
      { key: 'spherical_right', name: 'Spherical (Right Eye)', unit: 'D', valuePath: [] },
      { key: 'cylindrical_right', name: 'Cylindrical (Right Eye)', unit: 'D', valuePath: [] },
      { key: 'spherical_left', name: 'Spherical (Left Eye)', unit: 'D', valuePath: [] },
      { key: 'cylindrical_left', name: 'Cylindrical (Left Eye)', unit: 'D', valuePath: [] },
    ];
  }

  /**
   * Get test mapping by test name
   */
  private getTestMappingByName(testName: string): {
    key: string;
    name: string;
    unit: string;
    valuePath: string[];
    valuePath2?: string[];
  } | null {
    return this.getAllTestMappings().find((mapping) => mapping.name === testName) || null;
  }

  /**
   * Get test data object from parsed selected_test by trying primary key then alternativeKeys.
   */
  private getTestDataFromParsed(
    parsedTest: Record<string, any>,
    mapping: { key: string; alternativeKeys?: string[] },
  ): Record<string, any> | null {
    let data = parsedTest[mapping.key];
    if (data != null && typeof data === 'object') return data;
    for (const alt of mapping.alternativeKeys ?? []) {
      data = parsedTest[alt];
      if (data != null && typeof data === 'object') return data;
    }
    return null;
  }

  /**
   * Extract test value from selected_test JSON.
   * Tries primary key then alternativeKeys; for value tries valuePath then altValuePath (e.g. status for Romberg).
   */
  private extractTestValue(
    selectedTest: any,
    mapping: {
      key: string;
      alternativeKeys?: string[];
      valuePath: string[];
      valuePath2?: string[];
      altValuePath?: string[];
    },
  ): any {
    if (!selectedTest) {
      return null;
    }

    const parsedTest = this.parseSelectedTest(selectedTest);
    if (!parsedTest || typeof parsedTest !== 'object') {
      return null;
    }

    // Handle eye-specific tests (spherical_*, cylindrical_*) – read from eye_unit or vision_unit
    if (mapping.key.startsWith('spherical_') || mapping.key.startsWith('cylindrical_')) {
      const eyeUnit = parsedTest.eye_unit ?? parsedTest.vision_unit;
      if (!eyeUnit || typeof eyeUnit !== 'object') {
        return null;
      }
      const value = eyeUnit[mapping.key];
      return value !== null && value !== undefined && value !== '' ? value : null;
    }

    // Handle blood pressure (special case with two values)
    if (mapping.key === 'blood_pressure_unit') {
      const bpData = this.getTestDataFromParsed(parsedTest, mapping);
      if (!bpData) return null;
      const systolic = this.getNestedValue(bpData, mapping.valuePath);
      const diastolic = this.getNestedValue(bpData, mapping.valuePath2 || []);
      if (systolic !== null && systolic !== undefined && diastolic !== null && diastolic !== undefined) {
        return `${systolic}/${diastolic}`;
      }
      return null;
    }

    // Handle other tests: try primary key then alternativeKeys; value from valuePath then altValuePath
    const testData = this.getTestDataFromParsed(parsedTest, mapping);
    if (!testData) return null;

    let value = this.getNestedValue(testData, mapping.valuePath);
    if ((value === null || value === undefined || value === '') && mapping.altValuePath?.length) {
      value = this.getNestedValue(testData, mapping.altValuePath);
    }
    return value !== null && value !== undefined && value !== '' ? value : null;
  }
}