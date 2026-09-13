import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PrescriptionMedicine } from 'src/models/PrescriptionMedicine';
import { CreatePrescriptionMedicineDto } from './create-prescription-medicine-dto';
import { UpdatePrescriptionMedicineDto } from './update-prescription-medicine-dto';
import { Prescription } from 'src/models/Prescription';
import { v4 as uuidv4 } from 'uuid';
import { PrescriptionEditLogsService } from '../PrescriptionEditLogs/PrescriptionEditLogs.service';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class PrescriptionMedicineService {
  constructor(
    @InjectModel(Prescription)
    private readonly prescriptionModel: typeof Prescription,

    @InjectModel(PrescriptionMedicine)
    private prescriptionMedicineModel: typeof PrescriptionMedicine,

    private readonly prescriptionEditLogsService: PrescriptionEditLogsService,

    private readonly sequelize: Sequelize,
  ) {}

  // ✅ Create a new Prescription Medicine
async createPrescriptionMedicine(data: CreatePrescriptionMedicineDto): Promise<Prescription> {
  try {
    // this.validateFrequency(data.frequency);

    // Check if the Prescription exists
    const prescription = await this.prescriptionModel.findByPk(data.prescription_id, {
      include: [PrescriptionMedicine], // Include existing medicines
    });

    if (!prescription) {
      throw new NotFoundException(`Prescription with ID ${data.prescription_id} not found.`);
    }

    // Create new Prescription Medicine
    const prescriptionMedicine = await this.prescriptionMedicineModel.create({
      prescription_medicine_id: uuidv4(),
      prescription_id: data.prescription_id,
      medicine_name: data.medicine_name,
      dosage: data.dosage,
      frequency: data.frequency,
      duration: data.duration != null ? String(data.duration) : "",
      instructions: data.instructions ?? "",
      medicine_type: data.medicine_type
    });

    // ✅ Update the Prescription's medicines array
    await prescription.$add('medicines', prescriptionMedicine);

    // Fetch updated Prescription with all medicines
    const updatedPrescription = await this.prescriptionModel.findByPk(data.prescription_id, {
      include: [PrescriptionMedicine],
    });

    return updatedPrescription;
  } catch (error) {
    throw new Error(`Error creating prescription medicine: ${error.message}`);
  }
}


  


  // ✅ Get all Prescription Medicines for a given Prescription ID
  async getPrescriptionMedicinesByPrescriptionId(prescriptionId: string): Promise<PrescriptionMedicine[]> {
    return await this.prescriptionMedicineModel.findAll({
      where: { prescription_id: prescriptionId },
    });
  }

  // ✅ Get a single Prescription Medicine by ID
  async getPrescriptionMedicineById(id: string): Promise<PrescriptionMedicine> {
    const prescriptionMedicine = await this.prescriptionMedicineModel.findByPk(id);
    if (!prescriptionMedicine) {
      throw new NotFoundException(`Prescription medicine with ID ${id} not found.`);
    }
    return {
      ...prescriptionMedicine.get({ plain: true }),
      instructions: prescriptionMedicine.instructions ?? "",
    };
  }

  // Enhanced Update Prescription Medicine with change logging
  async updatePrescriptionMedicine(id: string, updateData: UpdatePrescriptionMedicineDto): Promise<PrescriptionMedicine> {
    return await this.sequelize.transaction(async (transaction) => {
      try {
        const prescriptionMedicine = await this.prescriptionMedicineModel.findByPk(id);
        if (!prescriptionMedicine) {
          throw new NotFoundException(`Prescription medicine with ID ${id} not found.`);
        }

        if (updateData.frequency) {
          this.validateFrequency(updateData.frequency);
        }

        // Store previous state
        const previousState = prescriptionMedicine.get({ plain: true });

        const updatedDuration = updateData.duration != null 
          ? String(updateData.duration) 
          : prescriptionMedicine.duration;

        // Update the medicine
        await prescriptionMedicine.update({
          medicine_name: updateData.medicine_name ?? prescriptionMedicine.medicine_name,
          medicine_type: updateData.medicine_type ?? prescriptionMedicine.medicine_type,
          dosage: updateData.dosage ?? prescriptionMedicine.dosage,
          frequency: updateData.frequency ?? prescriptionMedicine.frequency,
          duration: updatedDuration,
          instructions: updateData.instructions ?? prescriptionMedicine.instructions,
        }, { transaction });

        // Log the changes
        await this.prescriptionEditLogsService.logChanges(
          prescriptionMedicine.prescription_id,
          'PRESCRIPTION_MEDICINE',
          'UPDATE',
          previousState,
          prescriptionMedicine.get({ plain: true }),
          prescriptionMedicine.prescription_medicine_id,
          transaction
        );

        return prescriptionMedicine;
      } catch (error) {
        throw new Error(`Error updating prescription medicine: ${error.message}`);
      }
    });
  }

  // Enhanced Delete Prescription Medicine with change logging
  async deletePrescriptionMedicine(id: string): Promise<{ message: string }> {
    return await this.sequelize.transaction(async (transaction) => {
      const prescriptionMedicine = await this.prescriptionMedicineModel.findByPk(id);
      if (!prescriptionMedicine) {
        throw new NotFoundException(`Prescription medicine with ID ${id} not found.`);
      }

      // Store the state before deletion
      const previousState = prescriptionMedicine.get({ plain: true });

      // Delete the medicine
      await prescriptionMedicine.destroy({ transaction });

      // Log the deletion
      await this.prescriptionEditLogsService.logChanges(
        prescriptionMedicine.prescription_id,
        'PRESCRIPTION_MEDICINE',
        'DELETE',
        previousState,
        {},
        prescriptionMedicine.prescription_medicine_id,
        transaction
      );

      return { message: `Prescription medicine with ID ${id} deleted successfully.` };
    });
  }

  private validateFrequency(frequency: string[]) {
    const validFrequencies = ["Morning", "Afternoon", "Evening", "Night", "SOS","STAT"];
    
    // Ensure all elements in the array are valid
    for (const freq of frequency) {
      if (!validFrequencies.includes(freq)) {
        throw new Error(`Invalid frequency value: ${freq}`);
      }
    }
  }
}
