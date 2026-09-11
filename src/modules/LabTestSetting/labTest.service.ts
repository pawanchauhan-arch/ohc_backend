import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LabTestSetting } from '../../models/health-tests/LabTestSetting';


@Injectable()
export class LabSettingsService {
  constructor(
    @InjectModel(LabTestSetting)
    private labSettingModel: typeof LabTestSetting,
  ) {}

  /**
   * GENERIC SYNC: Handles both Single Object and Array of Objects.
   * Logic: If (test_profile + column_name) exists -> Update, Else -> Create.
   */
  async syncSettings(data: Partial<LabTestSetting> | Partial<LabTestSetting>[]) {
    // 1. Handle Array (Bulk Upsert)
    if (Array.isArray(data)) {
      if (data.length === 0) return { count: 0, message: 'Empty array' };
      const results = [];
      for (const item of data) {
        const existing = await this.labSettingModel.findOne({
          where: {
            test_profile: item.test_profile,
            column_name: item.column_name,
          },
        });
        if (existing) {
          existing.unit = item.unit;
          existing.min_range = item.min_range;
          existing.max_range = item.max_range;
          await existing.save();
          results.push(existing);
        } else {
          const newRecord = await this.labSettingModel.create({
            test_profile: item.test_profile,
            column_name: item.column_name,
            unit: item.unit,
            min_range: item.min_range,
            max_range: item.max_range,
          } as any);
          results.push(newRecord);
        }
      }
      return results;
    }
    // 2. Handle Single Object (Upsert)
    const existing = await this.labSettingModel.findOne({
      where: {
        test_profile: data.test_profile,
        column_name: data.column_name,
      },
    });
    if (existing) {
      existing.unit = data.unit;
      existing.min_range = data.min_range;
      existing.max_range = data.max_range;
      await existing.save();
      return existing;
    }
    return this.labSettingModel.create({
      test_profile: data.test_profile,
      column_name: data.column_name,
      unit: data.unit,
      min_range: data.min_range,
      max_range: data.max_range,
    } as any);
  }

  /**
   * Get settings by Profile Name (e.g., 'cbc')
   */
  async getByProfile(profile: string) {
    return this.labSettingModel.findAll({
      where: { test_profile: profile.toLowerCase() },
      order: [['column_name', 'ASC']],
    });
  }

  /**
   * Get All Settings
   */
  async findAll() {
    return this.labSettingModel.findAll();
  }
}