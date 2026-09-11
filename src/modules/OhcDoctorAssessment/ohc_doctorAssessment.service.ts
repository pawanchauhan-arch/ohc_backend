import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OHCDoctorAssessment } from '../../models/OHCDoctorAssessment.model';

@Injectable()
export class OhcDoctorAssessmentService {
  constructor(
    @InjectModel(OHCDoctorAssessment)
    private readonly model: typeof OHCDoctorAssessment,
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
  async findOne(id: number) {
  const record = await this.model.findOne({
    where: { id },
  });

  if (!record) {
    throw new NotFoundException('Record not found');
  }

  return record;
}
}