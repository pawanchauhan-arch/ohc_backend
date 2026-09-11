import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Param, 
  Body, 
  NotFoundException, 
  Query 
} from '@nestjs/common';
import { PrescriptionMedicineService } from './PrescriptionMedicine.service';
import { PrescriptionMedicine } from '../../models/PrescriptionMedicine';
import { CreatePrescriptionMedicineDto } from './create-prescription-medicine-dto';
import { UpdatePrescriptionMedicineDto } from './update-prescription-medicine-dto';
import { Prescription } from 'src/models/Prescription';
@Controller('api/prescription-medicines')
export class PrescriptionMedicineController {
  constructor(private readonly prescriptionMedicineService: PrescriptionMedicineService) {}

  // ✅ Create a single Prescription Medicine
  @Post()
  async createPrescriptionMedicine(
    @Body() prescriptionMedicineData: CreatePrescriptionMedicineDto,
  ): Promise<Prescription> {
    return this.prescriptionMedicineService.createPrescriptionMedicine(prescriptionMedicineData);
  }

  // ✅ Get Prescription Medicines by Prescription ID
  @Get('prescription/:prescriptionId')
  async getPrescriptionMedicinesByPrescriptionId(
    @Param('prescriptionId') prescriptionId: string,
  ): Promise<PrescriptionMedicine[]> {
    return this.prescriptionMedicineService.getPrescriptionMedicinesByPrescriptionId(prescriptionId);
  }

  // ✅ Get a single Prescription Medicine by ID
  @Get(':id')
  async getPrescriptionMedicineById(@Param('id') id: string): Promise<PrescriptionMedicine> {
    const prescriptionMedicine = await this.prescriptionMedicineService.getPrescriptionMedicineById(id);
    if (!prescriptionMedicine) {
      throw new NotFoundException(`Prescription Medicine with ID ${id} not found.`);
    }
    return prescriptionMedicine;
  }

  // ✅ Update a Prescription Medicine
  @Put(':id')
  async updatePrescriptionMedicine(
    @Param('id') id: string,
    @Body() prescriptionMedicineData: UpdatePrescriptionMedicineDto,
  ): Promise<PrescriptionMedicine> {
    return this.prescriptionMedicineService.updatePrescriptionMedicine(id, prescriptionMedicineData);
  }

  // ✅ Delete a Prescription Medicine
  @Delete(':id')
  async deletePrescriptionMedicine(@Param('id') id: string): Promise<{ message: string }> {
    return this.prescriptionMedicineService.deletePrescriptionMedicine(id);
  }
}
