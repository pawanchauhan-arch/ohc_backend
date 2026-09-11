import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PrescriptionEditLogs } from '../../models/PrescriptionEditLogs';
import { Prescription } from '../../models/Prescription';
import { PrescriptionMedicine } from '../../models/PrescriptionMedicine';
import { Transaction } from 'sequelize';

@Injectable()
export class PrescriptionEditLogsService {
  constructor(
    @InjectModel(PrescriptionEditLogs)
    private prescriptionEditLogsModel: typeof PrescriptionEditLogs,
  ) {}

  /**
   * Creates a log entry for prescription or prescription medicine changes
   */
  async logChanges(
    prescriptionId: string,
    type: 'PRESCRIPTION' | 'PRESCRIPTION_MEDICINE',
    action: 'UPDATE' | 'DELETE',
    previous: Record<string, any>,
    current: Record<string, any>,
    medicineId?: string,
    transaction?: Transaction,
  ): Promise<PrescriptionEditLogs> {
    // Calculate changed fields
    const changedFields = Object.keys(current).filter(
      key => JSON.stringify(previous[key]) !== JSON.stringify(current[key])
    );

    // Create log entry
    return await this.prescriptionEditLogsModel.create(
      {
        prescription_id: prescriptionId,
        changes: {
          type,
          action,
          medicine_id: medicineId,
          previous,
          current,
          changed_fields: changedFields,
        },
      },
      { transaction }
    );
  }

  /**
   * Retrieves edit history for a prescription
   */
  async getEditHistory(prescriptionId: string): Promise<PrescriptionEditLogs[]> {
    return await this.prescriptionEditLogsModel.findAll({
      where: { prescription_id: prescriptionId },
      order: [['created_at', 'DESC']],
    });
  }

  /**
   * Retrieves edit history for a specific prescription medicine
   */
  async getMedicineEditHistory(prescriptionId: string, medicineId: string): Promise<PrescriptionEditLogs[]> {
    return await this.prescriptionEditLogsModel.findAll({
      where: { 
        prescription_id: prescriptionId,
        '$changes.medicine_id$': medicineId 
      },
      order: [['created_at', 'DESC']],
    });
  }
} 