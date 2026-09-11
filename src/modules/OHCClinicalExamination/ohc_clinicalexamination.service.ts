import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OHCClinicalExamination } from '../../models/OHCClinicalExamination.model';

@Injectable()
export class OhcClinicalExaminationService {
  constructor(
    @InjectModel(OHCClinicalExamination)
    private readonly model: typeof OHCClinicalExamination,
  ) {}

  async create(data: any, req: any) {
    data.created_by = req.user.id;
    return this.model.create(data);
  }

  async findAll() {
    return this.model.findAll();
  }

  async findByPatient(patient_id: number) {
    return this.model.findAll({
      where: { patient_id },
    });
  }

  async update(id: number, data: any) {
    const record = await this.model.findOne({ where: { id } });

    if (!record) throw new NotFoundException('Record not found');

    await record.update(data);
    return record;
  }

  async softDelete(id: number) {
    const record = await this.model.findOne({ where: { id } });

    if (!record) throw new NotFoundException('Record not found');

    await record.update({ is_deleted: true });
    return { message: 'Deleted successfully' };
  }
  async findById(id: number) {
  return this.model.findAll({
    where: { id },
  });
}
}