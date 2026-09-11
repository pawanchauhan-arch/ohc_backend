import { Controller, Get, Param } from '@nestjs/common';
import { PrescriptionEditLogsService } from './PrescriptionEditLogs.service';
import { PrescriptionEditLogs } from '../../models/PrescriptionEditLogs';

@Controller('api/prescription-logs')
export class PrescriptionEditLogsController {
  constructor(private readonly prescriptionEditLogsService: PrescriptionEditLogsService) {}

  @Get(':prescriptionId')
  async getPrescriptionEditHistory(@Param('prescriptionId') prescriptionId: string): Promise<PrescriptionEditLogs[]> {
    return this.prescriptionEditLogsService.getEditHistory(prescriptionId);
  }

  @Get(':prescriptionId/medicine/:medicineId')
  async getMedicineEditHistory(
    @Param('prescriptionId') prescriptionId: string,
    @Param('medicineId') medicineId: string
  ): Promise<PrescriptionEditLogs[]> {
    return this.prescriptionEditLogsService.getMedicineEditHistory(prescriptionId, medicineId);
  }
} 