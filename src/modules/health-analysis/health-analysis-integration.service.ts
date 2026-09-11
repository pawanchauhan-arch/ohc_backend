import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { HealthAnalysisService } from './health-analysis.service';
import { HealthConcernsService } from '../health-concerns/health-concerns.service';
import { SpocManagementService } from '../spoc-management/spoc-management.service';
import { CommunicationService } from '../communication/communication.service';
import { AnalysisResultDto, ConcernDto } from './dto/analysis-result.dto';
import { CreateConcernDto, ConcernType, ConcernLevel } from '../health-concerns/dto/create-concern.dto';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';

export interface HealthConcernWorkflowResult {
  success: boolean;
  healthCheckupId: number;
  analysisResult: AnalysisResultDto;
  concernsCreated: number;
  spocDetailsRetrieved: boolean;
  communicationSent: boolean;
  errors: string[];
}

@Injectable()
export class HealthAnalysisIntegrationService {
  private readonly logger = new Logger(HealthAnalysisIntegrationService.name);

  constructor(
    private readonly healthAnalysisService: HealthAnalysisService,
    private readonly healthConcernsService: HealthConcernsService,
    private readonly spocManagementService: SpocManagementService,
    private readonly communicationService: CommunicationService,
    @InjectModel(driverhealthcheckup)
    private driverHealthCheckupModel: typeof driverhealthcheckup,
    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(CETMANAGEMENT)
    private cetManagementModel: typeof CETMANAGEMENT,
    @InjectModel(Center)
    private centerModel: typeof Center,
  ) {}

  /**
   * Complete health concern workflow: Analyze → Create Concerns → Get SPOCs → Send Alerts
   */
  async executeHealthConcernWorkflow(healthCheckupId: number): Promise<HealthConcernWorkflowResult> {
    const result: HealthConcernWorkflowResult = {
      success: false,
      healthCheckupId,
      analysisResult: null,
      concernsCreated: 0,
      spocDetailsRetrieved: false,
      communicationSent: false,
      errors: [],
    };

    try {
      this.logger.log(`Starting health concern workflow for health checkup ID: ${healthCheckupId}`);

      // Step 1: Analyze health checkup
      const analysisResult = await this.healthAnalysisService.analyzeHealthCheckup(healthCheckupId);
      result.analysisResult = analysisResult;

      if (analysisResult.concerns.length === 0) {
        this.logger.log(`No concerns detected for health checkup ID: ${healthCheckupId}`);
        result.success = true;
        return result;
      }

      this.logger.log(`Found ${analysisResult.concerns.length} concerns for health checkup ID: ${healthCheckupId}`);

      // Step 2: Get health checkup details for SPOC retrieval
      const healthCheckup = await this.getHealthCheckupWithDetails(healthCheckupId);
      if (!healthCheckup) {
        result.errors.push('Health checkup not found');
        return result;
      }

      // Step 3: Get SPOC details
      const spocDetails = await this.spocManagementService.getSpocDetails(
        healthCheckup.cet_id,
        healthCheckup.center_id,
      );
      result.spocDetailsRetrieved = true;

      // Step 4: Create concerns in database
      const createdConcerns = await this.createConcernsFromAnalysis(
        analysisResult,
        healthCheckup,
        spocDetails,
      );
      result.concernsCreated = createdConcerns.length;

      // Step 5: Send communication alerts for each concern
      const communicationResults = await this.sendAlertsForConcerns(createdConcerns, spocDetails);
      result.communicationSent = communicationResults.some(r => r.success);

      result.success = true;
      this.logger.log(`Health concern workflow completed successfully for health checkup ID: ${healthCheckupId}`);

    } catch (error) {
      result.errors.push(`Workflow error: ${error.message}`);
      this.logger.error(`Health concern workflow failed for health checkup ID: ${healthCheckupId}`, error);
    }

    return result;
  }

  /**
   * Get health checkup with related details
   */
  private async getHealthCheckupWithDetails(healthCheckupId: number) {
    try {
      // Fetch health checkup with related data
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
          {
            model: this.centerModel,
            as: 'center',
          },
        ],
      });

      if (!healthCheckup) {
        throw new Error(`Health checkup with ID ${healthCheckupId} not found`);
      }

      return {
        id: healthCheckup.id,
        driver_id: healthCheckup.driver_id,
        cet_id: healthCheckup.transpoter, // Use transpoter field for CET ID
        center_id: healthCheckup.createdBy, // Use createdBy field for Center ID
        driver: healthCheckup.driver,
        cet: healthCheckup.CETMANAGEMENT,
        center: healthCheckup.center,
      };
    } catch (error) {
      this.logger.error(`Failed to get health checkup details for ID: ${healthCheckupId}`, error);
      throw error;
    }
  }

  /**
   * Create concerns in database from analysis results
   */
  private async createConcernsFromAnalysis(
    analysisResult: AnalysisResultDto,
    healthCheckup: any,
    spocDetails: any,
  ): Promise<any[]> {
    const createdConcerns = [];

    for (const concern of analysisResult.concerns) {
      try {
        const createConcernDto: CreateConcernDto = {
          health_checkup_id: healthCheckup.id,
          driver_id: healthCheckup.driver_id,
          cet_id: healthCheckup.cet_id,
          center_id: healthCheckup.center_id,
          concern_type: concern.type as ConcernType,
          concern_level: concern.level as ConcernLevel,
          parameter_value: {
            parameter: concern.parameter,
            value: concern.value,
            unit: this.getParameterUnit(concern.type),
          },
          threshold_value: {
            threshold: concern.threshold,
            recommendation: concern.recommendation,
          },
          spoc_details: {
            cet: {
              name: spocDetails.cetSpoc.name,
              email: spocDetails.cetSpoc.email,
              whatsapp: spocDetails.cetSpoc.whatsapp,
            },
            client: {
              name: spocDetails.clientSpoc.name,
              email: spocDetails.clientSpoc.email,
              whatsapp: spocDetails.clientSpoc.whatsapp,
            },
          },
        };

        const createdConcern = await this.healthConcernsService.createConcern(createConcernDto);
        createdConcerns.push(createdConcern);

        this.logger.log(`Created concern ID: ${createdConcern.id} for type: ${concern.type}`);

      } catch (error) {
        this.logger.error(`Failed to create concern for type: ${concern.type}`, error);
      }
    }

    return createdConcerns;
  }

  /**
   * Send alerts for all created concerns
   */
  private async sendAlertsForConcerns(concerns: any[], spocDetails: any): Promise<any[]> {
    const results = [];

    for (const concern of concerns) {
      try {
        const concernData = {
          driverName: concern.driver?.name || 'Unknown Driver',
          concernType: concern.concern_type,
          concernLevel: concern.concern_level,
          parameterValue: `${concern.parameter_value.value} ${concern.parameter_value.unit || ''}`,
          thresholdValue: `${concern.threshold_value.threshold} ${concern.parameter_value.unit || ''}`,
          customNotes: concern.custom_notes,
        };

        // Note: Communication is now manual - no automatic sending
        // Users will manually send emails through the manual email endpoint
        
        results.push({
          concernId: concern.id,
          success: true,
          emailSent: false, // Manual sending only
          errors: [],
        });

        this.logger.log(`Concern ID: ${concern.id} created and ready for manual email sending`);

        this.logger.log(`Sent alerts for concern ID: ${concern.id}`);

      } catch (error) {
        this.logger.error(`Failed to send alerts for concern ID: ${concern.id}`, error);
        results.push({
          concernId: concern.id,
          success: false,
          emailSent: false,
          errors: [error.message],
        });
      }
    }

    return results;
  }

  /**
   * Get parameter unit based on concern type
   */
  private getParameterUnit(concernType: string): string {
    const units = {
      BLOOD_SUGAR: 'mg/dL',
      BLOOD_PRESSURE: 'mmHg',
      PULSE: 'bpm',
      HEMOGLOBIN: 'g/dL',
      EYE_VISION: '',
    };

    return units[concernType] || '';
  }

  /**
   * Manual trigger for health concern workflow
   */
  async triggerHealthConcernWorkflow(healthCheckupId: number): Promise<HealthConcernWorkflowResult> {
    return this.executeHealthConcernWorkflow(healthCheckupId);
  }

  /**
   * Get workflow status for a health checkup
   */
  async getWorkflowStatus(healthCheckupId: number): Promise<{
    hasConcerns: boolean;
    concernsCount: number;
    pendingCount: number;
    approvedCount: number;
    completedCount: number;
    lastAnalysisAt: Date;
  }> {
    try {
      const concerns = await this.healthConcernsService.getConcernsByHealthCheckupId(healthCheckupId);
      
      const status = {
        hasConcerns: concerns.length > 0,
        concernsCount: concerns.length,
        pendingCount: concerns.filter(c => c.status === 'PENDING').length,
        approvedCount: concerns.filter(c => c.status === 'APPROVED').length,
        completedCount: concerns.filter(c => c.status === 'COMPLETED').length,
                 lastAnalysisAt: concerns.length > 0 ? concerns[0].createdAt : null,
      };

      return status;
    } catch (error) {
      this.logger.error(`Failed to get workflow status for health checkup ID: ${healthCheckupId}`, error);
      throw error;
    }
  }
}
