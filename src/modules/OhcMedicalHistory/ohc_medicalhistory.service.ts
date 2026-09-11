import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OHCMedicalHistory } from '../../models/OHCMedicalHistory.model';

@Injectable()
export class OhcMedicalHistoryService {
  constructor(
    @InjectModel(OHCMedicalHistory)
    private readonly model: typeof OHCMedicalHistory,
  ) {}

  async create(data: any, req: any) {
    // created_by handled automatically via hook
     // created_by not handled automatically via hook
    data.created_by = req.user.id;
    return this.model.create(data);
  }

  async findAll() {
    // tenant + is_deleted handled automatically
    return this.model.findAll();
  }
//   async findAll() {
//   const records = await this.model.findAll();
//   return { data: records };
// }

  async findByPatient(patient_id: number) {
    return this.model.findAll({
      where: { patient_id },
    });
  }

  async update(id: number, data: any) {
    const record = await this.model.findByPk(id);

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    // updated_by handled automatically via hook
    await record.update(data);

    return record;
  }

  async softDelete(id: number) {
    const record = await this.model.findByPk(id);

    if (!record) {
      throw new NotFoundException('Record not found');
    }

    await record.update({ is_deleted: true });

    return { message: 'Deleted successfully' };
  }
  async findById(id: number) {
  return this.model.findAll({
    where: { id },
  });
}
}