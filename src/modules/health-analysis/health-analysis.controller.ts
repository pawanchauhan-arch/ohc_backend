import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, ParseIntPipe, Res } from '@nestjs/common';
import { Response } from 'express';
import { HealthAnalysisService } from './health-analysis.service';
import { HealthAnalysisIntegrationService } from './health-analysis-integration.service';
import { AnalyzeHealthDto } from './dto/analyze-health.dto';
import { AnalysisResultDto } from './dto/analysis-result.dto';
import { FilterHealthAnalysisDto, FilterHealthAnalysisResponseDto } from './dto/filter-health-analysis.dto';
import { CohortHealthAnalysisDto, CohortHealthAnalysisResponseDto } from './dto/cohort-health-analysis.dto';
import { DriverTestHistoryDto, DriverTestHistoryResponseDto } from './dto/driver-test-history.dto';
import { DriverFullTestHistoryDto, DriverFullTestHistoryResponseDto } from './dto/driver-full-test-history.dto';
import { ExportDriversVitalsCsvDto } from './dto/export-drivers-vitals-csv.dto';

@Controller('api/health-analysis')
export class HealthAnalysisController {
  constructor(
    private readonly healthAnalysisService: HealthAnalysisService,
    private readonly healthAnalysisIntegrationService: HealthAnalysisIntegrationService,
  ) {}

  /**
   * Analyze health checkup for concerns
   */
  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyzeHealthCheckup(@Body() analyzeHealthDto: AnalyzeHealthDto): Promise<AnalysisResultDto> {
    return this.healthAnalysisService.analyzeHealthCheckup(analyzeHealthDto.healthCheckupId);
  }

  /**
   * Execute complete health concern workflow
   */
  @Post('workflow/execute')
  @HttpCode(HttpStatus.OK)
  async executeHealthConcernWorkflow(@Body() analyzeHealthDto: AnalyzeHealthDto) {
    return this.healthAnalysisIntegrationService.executeHealthConcernWorkflow(analyzeHealthDto.healthCheckupId);
  }

  /**
   * Manual trigger for health concern workflow
   */
  @Post('workflow/trigger')
  @HttpCode(HttpStatus.OK)
  async triggerHealthConcernWorkflow(@Body() analyzeHealthDto: AnalyzeHealthDto) {
    return this.healthAnalysisIntegrationService.triggerHealthConcernWorkflow(analyzeHealthDto.healthCheckupId);
  }

  /**
   * Get workflow status for a health checkup
   */
  @Get('workflow/status/:healthCheckupId')
  @HttpCode(HttpStatus.OK)
  async getWorkflowStatus(@Param('healthCheckupId', ParseIntPipe) healthCheckupId: number) {
    return this.healthAnalysisIntegrationService.getWorkflowStatus(healthCheckupId);
  }

  /**
   * Filter health checkup records by date range, Corporate ID, and Center ID
   * Returns grouped test data classified by color categories
   */
  @Post('filter')
  @HttpCode(HttpStatus.OK)
  async filterHealthAnalysis(
    @Body() filterDto: FilterHealthAnalysisDto,
  ): Promise<FilterHealthAnalysisResponseDto> {
    return this.healthAnalysisService.filterHealthAnalysis(filterDto);
  }

  /**
   * Cohort Health Analysis - Compare two cohorts and return patient counts by test parameter and color category
   * Cohort 1: A specific month (e.g., Jan 2026)
   * Cohort 2: Historical range from organization start date to (Cohort 1 month - monthsBack)
   * Returns aggregated patient counts for common drivers present in both cohorts
   */
  @Post('cohort-analysis')
  @HttpCode(HttpStatus.OK)
  async cohortHealthAnalysis(
    @Body() cohortDto: CohortHealthAnalysisDto,
  ): Promise<CohortHealthAnalysisResponseDto> {
    return this.healthAnalysisService.cohortHealthAnalysis(cohortDto);
  }

  /**
   * Get driver test history - Returns first and last test values for specified drivers
   * Accepts a list of driver IDs and a test name
   * Returns driver name, ID, first and last test values, and CET/Center names from last record
   */
  @Post('driver-test-history')
  @HttpCode(HttpStatus.OK)
  async getDriverTestHistory(
    @Body() dto: DriverTestHistoryDto,
  ): Promise<DriverTestHistoryResponseDto> {
    return this.healthAnalysisService.getDriverTestHistory(dto);
  }

  /**
   * Get full test history for a single driver: all tests, all records, with color category per value.
   * Same color logic as driver-test-history; CET/Center from last record.
   */
  @Post('driver-full-test-history')
  @HttpCode(HttpStatus.OK)
  async getDriverFullTestHistory(
    @Body() dto: DriverFullTestHistoryDto,
  ): Promise<DriverFullTestHistoryResponseDto> {
    return this.healthAnalysisService.getDriverFullTestHistory(dto.driverId, dto.centerIds);
  }

  /**
   * Export XLSX of last vital values for given drivers. Triggers file download.
   * One column per vital with cell background colored by risk (red/amber/yellow/green). Legend at top. N/A when no record has that vital.
   */
  @Post('export-drivers-vitals-csv')
  async exportDriversVitalsCsv(
    @Body() dto: ExportDriversVitalsCsvDto,
    @Res() res: Response,
  ): Promise<void> {
    const buffer = await this.healthAnalysisService.getDriversVitalsCsv(dto.driverIds);
    const filename = 'Patients-vitals.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
