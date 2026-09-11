import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OHCLabInvestigation } from '../../models/OHCLabInvestigation.model';
import { OHCLabTestResult } from '../../models/OHCLabTestResult.model';

@Injectable()
export class OhcLabService {
  constructor(
    @InjectModel(OHCLabInvestigation)
    private readonly investigationModel: typeof OHCLabInvestigation,

    @InjectModel(OHCLabTestResult)
    private readonly testModel: typeof OHCLabTestResult,

    private readonly sequelize: Sequelize,
  ) {}

  // ✅ Create Investigation + Tests (Transaction Safe)
  async createInvestigation(data: any, req: any) {
    // data.created_by = req.user.id;
    const created_by = req.user.id;
    const {
    patient_id,
    name,
    gender,
    age,
    employee_id,
    investigation_date,
    remarks,
    
    tests = [],
  } = data;

    return this.sequelize.transaction(async (t) => {
      // Create main record
      const investigation = await this.investigationModel.create(
        {
        patient_id,
        name,
        gender,
        age,
        employee_id,
        investigation_date,
        remarks,
        created_by,
        },
        { transaction: t },
      );

      // Prepare test records
      const testRecords = tests.map((test: any) => ({
        investigation_id: investigation.id,
        test_name: test.test_name,
        result_value: test.result_value,
        normal_range: test.normal_range,
        remarks: test.remarks,
        report_url: test.report_url,
        created_by,
      }));

      // Bulk insert tests
      if (testRecords.length > 0) {
        await this.testModel.bulkCreate(testRecords, {
          transaction: t,
          individualHooks: true, // IMPORTANT for audit fields
        });
      }

      return investigation;
    });
  }

  // ✅ Get all investigations with tests
  async findAll() {
    return this.investigationModel.findAll({
      include: [
        {
          model: this.testModel,
        },
      ],
    });
  }

  // ✅ Get by patient
  async findByPatient(patient_id: number) {
    return this.investigationModel.findAll({
      where: { patient_id },
      include: [
        {
          model: this.testModel,
        },
      ],
    });
  }

  // (Optional) Get single investigation
  async findOne(id: number) {
    const record = await this.investigationModel.findOne({
      where: { id },
      include: [{ model: this.testModel }],
    });

    if (!record) {
      throw new NotFoundException('Investigation not found');
    }

    return record;
  }
  async updateInvestigation(id: number, data: any, req: any) {
    const created_by = req.user.id;
  const {
    tests = [],
    name,
    gender,
    age,
    employee_id,
    investigation_date,
    remarks,
  } = data;

  return this.sequelize.transaction(async (t) => {
    const investigation = await this.investigationModel.findByPk(id, {
      transaction: t,
    });

    if (!investigation) {
      throw new NotFoundException('Investigation not found');
    }

    await investigation.update(
      {
        name,
        gender,
        age,
        employee_id,
        investigation_date,
        remarks,
        created_by
      },
      { transaction: t }
    );

    await this.testModel.destroy({
      where: { investigation_id: id },
      transaction: t,
    });

    const newTests = tests.map((test: any) => ({
      investigation_id: id,
      test_name: test.test_name,
      result_value: test.result_value,
      normal_range: test.normal_range,
      remarks: test.remarks,
      report_url: test.report_url,
      created_by
    }));

    if (newTests.length > 0) {
      await this.testModel.bulkCreate(newTests, {
        transaction: t,
      });
    }

    return investigation;
  });
}
async deleteInvestigation(id: number) {
  return this.sequelize.transaction(async (t) => {
    const record = await this.investigationModel.findByPk(id, {
      transaction: t,
    });

    if (!record) throw new NotFoundException('Not found');
    await record.update({ is_deleted: true }, { transaction: t });
    await this.testModel.update(
      { is_deleted: true },
      {
        where: { investigation_id: id },
        transaction: t,
      }
    );

    return { message: 'Deleted successfully' };
  });
}
}