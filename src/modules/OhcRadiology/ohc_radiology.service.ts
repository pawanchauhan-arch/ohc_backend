import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OHCRadiology } from '../../models/OHCRadiology.model';
import { OHCRadiologyTestResult } from '../../models/OHCRadiologyTestResult.model';
import { Sequelize } from 'sequelize-typescript';
@Injectable()
export class OhcRadiologyService {
  constructor(
    @InjectModel(OHCRadiology)
    private readonly model: typeof OHCRadiology,
     @InjectModel(OHCRadiologyTestResult)
    private readonly testModel: typeof OHCRadiologyTestResult,

    private readonly sequelize: Sequelize,
  ) {}
  

  // async create(data: any, req: any) {
  //   data.created_by = req.user.id;
  //   return this.model.create(data);
  // }
   async create(data: any, req: any) {
    const created_by = req.user.id;

    const {
      patient_id,
      name,
      gender,
      age,
      employee_id,
      remarks,
      tests = [],
    } = data;

    return this.sequelize.transaction(async (t) => {
      const radiology = await this.model.create(
        {
          patient_id,
          name,
          gender,
          age,
          employee_id,
          remarks,
          created_by,
        },
        { transaction: t }
      );

      const testRecords = tests.map((test: any) => ({
        radiology_id: radiology.id,
        test_type: test.test_type,
        result_summary: test.result_summary,
        doctor_remarks: test.doctor_remarks,
        report_url: test.report_url,
        created_by,
      }));

      if (testRecords.length > 0) {
        await this.testModel.bulkCreate(testRecords, {
          transaction: t,
        });
      }

      return radiology;
    });
  }

  // async findAll() {
  //   return this.model.findAll();
  // }
   async findAll() {
    return this.model.findAll({
      include: [this.testModel],
    });
  }

  async findByPatient(patient_id: number) {
   return this.model.findAll({
  where: { patient_id },
  include: [this.testModel],
});
      
    
  }

  // async update(id: number, data: any) {
  //   const record = await this.model.findOne({ where: { id } });

  //   if (!record) throw new NotFoundException('Record not found');

  //   await record.update(data);
  //   return record;
  // }
   async update(id: number, data: any, req: any) {
    const updated_by = req.user.id;

    return this.sequelize.transaction(async (t) => {
      const record = await this.model.findByPk(id);

      if (!record) throw new NotFoundException();

      await record.update({ ...data, updated_by }, { transaction: t });

      await this.testModel.destroy({
        where: { radiology_id: id },
        transaction: t,
      });

      const newTests = data.tests.map((test: any) => ({
        radiology_id: id,
        test_type: test.test_type,
        result_summary: test.result_summary,
        doctor_remarks: test.doctor_remarks,
        report_url: test.report_url,
        updated_by,
      }));

      await this.testModel.bulkCreate(newTests, { transaction: t });

      return record;
    });
  }

  // async softDelete(id: number) {
  //   const record = await this.model.findOne({ where: { id } });

  //   if (!record) throw new NotFoundException('Record not found');

  //   await record.update({ is_deleted: true });
  //   return { message: 'Deleted successfully' };
  // }
  async softDelete(id: number) {
    return this.sequelize.transaction(async (t) => {
      await this.model.update(
        { is_deleted: true },
        { where: { id }, transaction: t }
      );

      await this.testModel.update(
        { is_deleted: true },
        { where: { radiology_id: id }, transaction: t }
      );

      return { message: 'Deleted successfully' };
    });
  }
  async findOne(id: number) {
  const record = await this.model.findOne({
    where: { id },
    include: [this.testModel], 
  });

  if (!record) {
    throw new NotFoundException('Record not found');
  }

  return record;
}
}