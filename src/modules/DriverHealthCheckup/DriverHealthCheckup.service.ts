import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { DRIVERMASTERPERSONAL } from '../../models/DriverMasterPersonal';
import { DriverHealthStats } from 'src/models/DriverHealthStats';
import { Op, Sequelize } from 'sequelize';
import { Doctor } from 'src/models/Doctor';
import { User } from 'src/models/User';
import { CETMANAGEMENT } from 'src/models/CetManagement';
import { CenterUser } from 'src/models/CenterUser';
import { Center } from 'src/models/Center';
import { Prescription } from 'src/models/Prescription';
import { PrescriptionMedicine } from 'src/models/PrescriptionMedicine';
import { Corporate } from 'src/models/corporate';
import { CampListItem } from '../../models/CampListItem';
import * as moment from 'moment-timezone';
import { DownloadHealthRecordDto } from './dto/download-health-record.dto';
import {
  EcgUnitPayload,
  LatestEcgByDriverResponse,
} from './dto/latest-ecg-response.type';

@Injectable()
export class DriverHealthCheckupService {
  constructor(
    @InjectModel(driverhealthcheckup)
    private driverHealthCheckupModel: typeof driverhealthcheckup,
    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(DriverHealthStats)
    private readonly driverHealthStatsModel: typeof DriverHealthStats,

    @InjectModel(Doctor)
    private readonly doctorModel: typeof Doctor,

    @InjectModel(User)
    private readonly userModel: typeof User,

    @InjectModel(CETMANAGEMENT)
    private readonly cetManagementModel: typeof CETMANAGEMENT,

    @InjectModel(CenterUser)
    private readonly centerUserModel: typeof CenterUser,

    @InjectModel(Center)
    private readonly centerModel: typeof Center,

    @InjectModel(Corporate)
    private readonly corporateModel: typeof Corporate,

    @InjectModel(CampListItem)
    private readonly campListItemModel: typeof CampListItem,

    // private readonly sequelize: Sequelize,
  ) {}

//   async getFullHealthCheckupDetailsByPhone(phoneNumber: string): Promise<any> {
//   const driver = await this.driverMasterModel.findOne({ where: { contactNumber: phoneNumber } });

//   if (!driver) {
//     throw new NotFoundException(`Driver with phone number ${phoneNumber} not found`);
//   }

//   const healthCheckups = await this.driverHealthCheckupModel.findAll({
//     where: { id: driver.id },
//     include: [
//       {
//         model: this.doctorModel,
//         as: 'doctor',
//         include: [
//           {
//             model: this.userModel,
//             as: 'user',
//             attributes: ['id', 'username', 'status', 'phone'],
//           },
//         ],
//       },
//       // {
//       //   model: this.driverMasterModel,
//       //   as: 'driver',
//       //   include: [
//       //     {
//       //       model: this.driverMasterModel,
//       //       attributes: ['id', 'blood_group'],
//       //     },
//       //   ],
//       // },
//       {
//         model: this.cetManagementModel,
//         as: 'CETMANAGEMENT',
//       },
//     ],
//     order: [['id', 'DESC']],
//   });

//   if (!healthCheckups.length) {
//     throw new NotFoundException(`No health checkups found for driver with phone number ${phoneNumber}`);
//   }

//   const results = [];

//   for (const checkup of healthCheckups) {
//     const centerUser = await this.centerUserModel.findOne({
//       where: { user_id: checkup.user_id },
//       raw: true,
//       nest: true,
//     });

//     const center = centerUser
//       ? await this.centerModel.findOne({ where: { id: centerUser.center_id }, raw: true, nest: true })
//       : null;

//     const user = await this.userModel.findOne({
//       where: { id: checkup.createdBy },
//       attributes: ['username', 'name', 'email', 'phone', 'status', 'external_id'],
//       raw: true,
//       nest: true,
//     });

//     // const packageData = checkup.package_list?.length
//     //   ? await this.packageManagementModel.findAll({
//     //       where: {
//     //         id: {
//     //           [Op.in]: checkup.package_list,
//     //         },
//     //       },
//     //       order: [['id', 'DESC']],
//     //       raw: true,
//     //       nest: true,
//     //     })
//     //   : [];

//     results.push({
//       checkup,
//       doctorDetails: checkup.doctor,
//       cetDetails: checkup.CETMANAGEMENT,
//       driverDetails: driver,
//       centerMetaData: {
//         signature: centerUser?.signature || null,
//         center,
//         user,
//       },
//       driver
//       // packageMetaData: packageData,
//     });
//   }

//   return results;
// }

async getFullHealthCheckupDetailsById(healthCheckupId: string): Promise<any> {
  const checkup = await this.driverHealthCheckupModel.findOne({
    where: { id: healthCheckupId },
    include: [
      {
        model: this.doctorModel,
        as: 'doctor',
        include: [
          {
            model: this.userModel,
            as: 'user',
            attributes: ['id', 'username', 'status', 'phone'],
          },
        ],
      },
      {
        model: this.cetManagementModel,
        as: 'CETMANAGEMENT',
      },
      {
        model: this.driverMasterModel,
        as: 'driver', // alias must match your association
      },
    ],
    order: [['id', 'DESC']],
  });

  if (!checkup) {
    throw new NotFoundException(`Health checkup with id ${healthCheckupId} not found`);
  }

  const centerUser = await this.centerUserModel.findOne({
    where: { user_id: checkup.user_id },
    raw: true,
    nest: true,
  });

  const center = centerUser
    ? await this.centerModel.findOne({ where: { id: centerUser.center_id }, raw: true, nest: true })
    : null;

  const user = await this.userModel.findOne({
    where: { id: checkup.createdBy },
    attributes: ['username', 'name', 'email', 'phone', 'status', 'external_id'],
    raw: true,
    nest: true,
  });

  return {
    checkup,
    // doctorDetails: checkup.doctor,
    // driverDetails: checkup.driver,
    // cetDetails: checkup.CETMANAGEMENT,
    centerMetaData: {
      signature: centerUser?.signature || null,
      center,
      user,
    },
  };
}



  async getDriverHealthCheckupByPhoneNumber(phoneNumber: string): Promise<driverhealthcheckup[]> {
    // Find the driver by phone number
    const driver = await this.driverMasterModel.findOne({ where: { contactNumber: phoneNumber } });
    if (!driver) {
      throw new NotFoundException(`Driver with phone number ${phoneNumber} not found`);
    }

    // Find the health checkups associated with the driver
    const healthCheckups = await this.driverHealthCheckupModel.findAll({ where: { driver_id: driver.id } });
    if (healthCheckups.length === 0) {
      throw new NotFoundException(`No health checkup records found for driver with phone number ${phoneNumber}`);
    }

    return healthCheckups;
  }

  async getDriverHealthCheckupByDriverID(driver_id: number): Promise<driverhealthcheckup> {
    // Find the latest health checkup associated with the driver
    const healthCheckup = await this.driverHealthCheckupModel.findOne({
      where: { driver_id: driver_id },
      order: [['createdAt', 'DESC']], // Sort by createdAt in descending order (latest first)
    });
  
    if (!healthCheckup) {
      throw new NotFoundException(`No health checkup records found for driver with driverID ${driver_id}`);
    }
  
    return healthCheckup;
  }
  /**
   * Fetch all health checkup records for a driver by driver ID.
   * Includes merged_report_url from camp_list_item (linked via driver_health_checkup_id).
   * @param driverId Driver identifier
   * @returns List of driverhealthcheckup records with merged_report_url
   */
  async listDriverHealthCheckupsByDriverID(driverId: number): Promise<(driverhealthcheckup & { merged_report_url?: string | null })[]> {
    const healthCheckups = await this.driverHealthCheckupModel.findAll({
      where: { driver_id: driverId },
      order: [['createdAt', 'DESC']],
    });
    if (healthCheckups.length === 0) {
      throw new NotFoundException(`No health checkup records found for driver with driverID ${driverId}`);
    }

    const campListItems = await this.campListItemModel.findAll({
      where: {
        driver_id: driverId,
        driver_health_checkup_id: { [Op.in]: healthCheckups.map((h) => h.id) },
      },
      attributes: ['driver_health_checkup_id', 'merged_report_url'],
    });

    const urlMap = new Map<number, string>();
    for (const item of campListItems) {
      const url = (item.merged_report_url || '').trim();
      if (url && !urlMap.has(item.driver_health_checkup_id)) {
        urlMap.set(item.driver_health_checkup_id, url);
      }
    }

    return healthCheckups.map((h) => ({
      ...h.toJSON(),
      merged_report_url: urlMap.get(h.id) ?? null,
    })) as (driverhealthcheckup & { merged_report_url?: string | null })[];
  }
  
  async populateDriverHealthStats(driver_id: number): Promise<DriverHealthStats> {
    // Fetch all health checkups for the driver
    const healthCheckups = await this.driverHealthCheckupModel.findAll({
      where: { driver_id },
    });

    if (healthCheckups.length === 0) {
      throw new NotFoundException(`No health checkup records found for driver with ID ${driver_id}`);
    }

    let maxBloodSugar = -Infinity;
    let maxSystolic = -Infinity;
    let maxDiastolic = -Infinity;

    // Iterate through all health checkup records
    for (const checkup of healthCheckups) {
      let selectedTest: any;
      try {
        selectedTest = typeof checkup.selected_test === 'string'
          ? JSON.parse(checkup.selected_test)
          : checkup.selected_test;
      } catch (error) {
        console.error(`Error parsing selected_test for record ID ${checkup.id}:`, error);
        continue;
      }

      if (selectedTest?.random_blood_sugar_unit?.value) {
        const bloodSugar = parseFloat(selectedTest.random_blood_sugar_unit.value);
        if (!isNaN(bloodSugar) && bloodSugar > maxBloodSugar) {
          maxBloodSugar = bloodSugar;
        }
      }

      const systolic = parseFloat(selectedTest?.blood_pressure_unit?.systolic_bp_unit?.value || '-Infinity');
      const diastolic = parseFloat(selectedTest?.blood_pressure_unit?.diastolic_bp_unit?.value || '-Infinity');

      if (!isNaN(systolic) && systolic > maxSystolic) {
        maxSystolic = systolic;
        maxDiastolic = diastolic;
      }
    }

    // Classify Diabetes
    let diabetesCategory: string;
    if (maxBloodSugar < 70) {
      diabetesCategory = 'Low Blood Sugar (Hypoglycemia)';
    } else if (maxBloodSugar < 140) {
      diabetesCategory = 'Normal';
    } else if (maxBloodSugar <= 199) {
      diabetesCategory = 'Prediabetes';
    } else {
      diabetesCategory = 'Diabetes';
    }

    // Classify Cardiac Health
    let cardiacCategory: string;

    if (maxSystolic < 90 && maxDiastolic < 60) {
      cardiacCategory = 'Hypotension';
    } else if (maxSystolic > 140 || maxDiastolic > 90) {
      cardiacCategory = 'Stage 2 Hypertension';
    } else if ((maxSystolic >= 131 && maxSystolic <= 140) || (maxDiastolic >= 86 && maxDiastolic <= 90)) {
      cardiacCategory = 'Stage 1 Hypertension';
    } else if ((maxSystolic >= 121 && maxSystolic <= 130) || (maxDiastolic >= 81 && maxDiastolic <= 85)) {
      cardiacCategory = 'High-Normal';
    } else if ((maxSystolic >= 100 && maxSystolic <= 120) || (maxDiastolic >= 70 && maxDiastolic <= 80)) {
      cardiacCategory = 'Normal';
    } else {
      cardiacCategory = 'Uncategorized';  // fallback for anything unusual
    }
    // Check if DriverHealthStats exists for the driver
    let healthStats = await this.driverHealthStatsModel.findOne({ where: { driver_id } });

    if (!healthStats) {
      // Create new health stats record if not found
      healthStats = await this.driverHealthStatsModel.create({
        driver_id,
        diabetes_status: diabetesCategory,
        cardiac_status: cardiacCategory,
      });
    } else {
      // Update existing health stats record
      healthStats.diabetes_status = diabetesCategory;
      healthStats.cardiac_status = cardiacCategory;
      await healthStats.save();
    }

    return healthStats;
  }
  async getDriverHealthStats(driverId: number): Promise<DriverHealthStats | null> {
    return this.driverHealthStatsModel.findOne({
      where: { driver_id: driverId },
    });
  }
  async populateHealthStatsForAllDrivers(): Promise<void> {
    // Fetch all drivers from the `DRIVERMASTER` table
    const allDrivers = await this.driverMasterModel.findAll();
  
    if (!allDrivers || allDrivers.length === 0) {
      throw new NotFoundException('No drivers found in the DriverMaster table.');
    }
  
    for (const driver of allDrivers) {
      try {
        // Call the method to populate health stats for an individual driver
        await this.populateDriverHealthStats(driver.id);
      } catch (error) {
        console.error(`Failed to populate health stats for driver ID: ${driver.id}`, error);
      }
    }
  
    console.log('Health stats populated for all drivers.');
  }



  async downloadHealthCheckupRecords(
    dto: DownloadHealthRecordDto,
  ) {
    try {
      // -------------------------
      // VALIDATION: Either corporate OR cet
      // -------------------------
      if (!dto.corporate_id && !dto.cet_id) {
        throw new BadRequestException(
          'Either corporate_id or cet_id must be provided',
        );
      }

      if (dto.corporate_id && dto.cet_id) {
        throw new BadRequestException(
          'corporate_id and cet_id cannot be used together',
        );
      }

      // -------------------------
      // BASE WHERE CONDITION
      // -------------------------
      const whereCondition: any = {
        date_time: {
          [Op.between]: [dto.startDate, dto.endDate],
        },
      };

      // -------------------------
      // CORPORATE FILTER
      // -------------------------
      if (dto.corporate_id) {
        const corporate = await this.corporateModel.findByPk(
          dto.corporate_id,
        );

        if (!corporate) {
          throw new NotFoundException('Corporate not found');
        }

        if (!corporate.center_ids?.length) {
          throw new NotFoundException(
            'No centers mapped to this corporate',
          );
        }

        whereCondition.createdBy = {
          [Op.in]: corporate.center_ids,
        };
      }

      // -------------------------
      // CET FILTER
      // -------------------------
      if (dto.cet_id) {
        if (
          [89, 124, 142, 190, 235, 242].includes(dto.cet_id)
        ) {
          whereCondition.transpoter = {
            [Op.in]: [89, 124, 142, 190, 235, 242],
          };
        } else {
          whereCondition.transpoter = dto.cet_id;
        }
      }

      // -------------------------
      // OPTIONAL FILTERS
      // -------------------------
      if (dto.driver_ID) {
        whereCondition.driver_id = dto.driver_ID;
      }

      if (dto.vehicle_no) {
        whereCondition.vehicle_no = dto.vehicle_no;
      }

      // -------------------------
      // FETCH RECORDS
      // -------------------------
      const records = await this.driverHealthCheckupModel.findAll({
        where: whereCondition,
        include: [
          {
            model: DRIVERMASTER,
            as: 'driver',
            attributes: [
              'healthCardNumber',
              'name',
              'contactNumber',
              'idProof',
              'idProof_number',
            ],
          },
          {
            model: Center,
            as: 'center',
            attributes: [
              'project_name',
              'project_address',
              'center_address',
            ],
          },
          {
            model: Prescription,
            as: 'checkupPrescriptions',
            required: false,
            include: [
              {
                model: PrescriptionMedicine,
                as: 'medicines',
                required: false,
              },
            ],
          },
        ],
        order: [['date_time', 'DESC']],
      });

      if (!records.length) {
        throw new NotFoundException(
          'No health checkup records found',
        );
      }

      // -------------------------
      // RESPONSE MAPPING
      // -------------------------
      return records.map((record: any) => ({
        healthCardNumber:
          record.driver?.healthCardNumber || null,
        name: record.driver?.name || null,
        contactNumber:
          record.driver?.contactNumber || null,
        idProof: record.driver?.idProof || null,
        idProof_number:
          record.driver?.idProof_number || null,
        id: record.id,
        driver_id: record.driver_id,
        vehicle_no: record.vehicle_no,
        date_time: moment(record.date_time)
          .tz('Asia/Kolkata')
          .format('YYYY-MM-DD HH:mm:ss'),
        selected_package_name:
          record.selected_package_name,
        center_name:
          record.center?.project_name || null,
        center_address:
          record.center?.center_address || null,
        test_results: record.selected_test || {},
        prescriptions:
          record.checkupPrescriptions?.map((p: any) => ({
            prescription_id: p.prescription_id,
            lab: p.lab,
            other_lab: p.other_lab,
            instructions: p.instructions,
            chief_complaints: p.chief_complaints,
            follow_up: p.follow_up,
            preventive_advice: p.preventive_advice,
            prescription_slip_image:
              p.prescription_slip_image,
            prescription_slip_text:
              p.prescription_slip_text,
            vitals: p.vitals,
            health_conditions: p.health_conditions,
            drug_allergies: p.drug_allergies,
            diagnose: p.diagnose,
            fitness_status: p.fitness_status,
            created_at: moment(p.createdAt)
              .tz('Asia/Kolkata')
              .format('YYYY-MM-DD HH:mm:ss'),
            medicines:
              p.medicines?.map((m: any) => ({
                prescription_medicine_id:
                  m.prescription_medicine_id,
                medicine_name: m.medicine_name,
                dosage: m.dosage,
                frequency: m.frequency,
                medicine_type: m.medicine_type,
                duration: m.duration,
                instructions: m.instructions,
              })) || [],
          })) || [],
      }));
    } catch (error) {
      console.error(
        'Download Health Record Error:',
        error,
      );
      throw new InternalServerErrorException(
        'An error occurred while generating response',
      );
    }
  }

  /**
   * Returns the newest confirmed health checkup with ECG that has a doc URL,
   * walking older records when newer ones lack a valid report URL.
   */
  async getLatestEcgByDriverId(driverId: number): Promise<LatestEcgByDriverResponse> {
    if (!Number.isFinite(driverId) || driverId <= 0) {
      throw new BadRequestException('Invalid driver_id');
    }
    const checkups = await this.driverHealthCheckupModel.findAll({
      where: {
        driver_id: driverId,
        is_submited: true,
        confirm_report: 'yes',
      },
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'driver_id', 'date_time', 'createdAt', 'selected_test', 'ecg_unit'],
    });
    let newestEcgWithoutDoc: driverhealthcheckup | null = null;
    for (const checkup of checkups) {
      const ecgUnit = this.resolveEcgUnit(checkup);
      if (!ecgUnit) {
        continue;
      }
      if (!newestEcgWithoutDoc) {
        newestEcgWithoutDoc = checkup;
      }
      const docUrl = this.resolveEcgReportUrl(ecgUnit);
      if (docUrl) {
        return this.buildLatestEcgResponse(checkup, ecgUnit, docUrl);
      }
    }
    if (newestEcgWithoutDoc) {
      const ecgUnit = this.resolveEcgUnit(newestEcgWithoutDoc);
      return this.buildLatestEcgResponse(newestEcgWithoutDoc, ecgUnit, null);
    }
    throw new NotFoundException(
      `No confirmed health checkup with ECG found for driver with driverID ${driverId}`,
    );
  }

  private parseSelectedTest(selectedTest: unknown): Record<string, unknown> | null {
    if (!selectedTest) {
      return null;
    }
    if (typeof selectedTest === 'string') {
      try {
        return JSON.parse(selectedTest) as Record<string, unknown>;
      } catch {
        return null;
      }
    }
    if (typeof selectedTest === 'object') {
      return selectedTest as Record<string, unknown>;
    }
    return null;
  }

  private resolveEcgUnit(checkup: driverhealthcheckup): EcgUnitPayload | null {
    const selectedTest = this.parseSelectedTest(checkup.selected_test);
    const rawEcg =
      (selectedTest?.ecg_unit as Record<string, unknown> | undefined) ??
      (checkup.ecg_unit as Record<string, unknown> | undefined);
    if (!rawEcg || typeof rawEcg !== 'object') {
      return null;
    }
    const value = rawEcg.value != null ? String(rawEcg.value) : null;
    const status = rawEcg.status != null ? String(rawEcg.status) : null;
    if (value == null && status == null) {
      return null;
    }
    const doc =
      typeof rawEcg.doc === 'string' && rawEcg.doc.trim() !== ''
        ? rawEcg.doc.trim()
        : null;
    return {
      key: typeof rawEcg.key === 'string' ? rawEcg.key : 'ecg_unit',
      label: typeof rawEcg.label === 'string' ? rawEcg.label : 'ECG',
      value,
      doc,
      standard_value: rawEcg.standard_value ?? null,
      status,
      remark: rawEcg.remark != null ? String(rawEcg.remark) : null,
      units: typeof rawEcg.units === 'string' ? rawEcg.units : undefined,
    };
  }

  private resolveEcgReportUrl(ecgUnit: EcgUnitPayload): string | null {
    const doc = ecgUnit.doc?.trim();
    if (!doc || !doc.startsWith('http')) {
      return null;
    }
    return doc;
  }

  private buildLatestEcgResponse(
    checkup: driverhealthcheckup,
    ecgUnit: EcgUnitPayload,
    ecgReportUrl: string | null,
  ): LatestEcgByDriverResponse {
    return {
      health_checkup_id: checkup.id,
      driver_id: checkup.driver_id,
      date_time: checkup.date_time ?? null,
      createdAt: checkup.createdAt,
      ecg_unit: ecgUnit,
      ecg_report_url: ecgReportUrl,
    };
  }
}