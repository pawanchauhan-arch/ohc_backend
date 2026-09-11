import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, QueryTypes } from 'sequelize';
import { PicasoPatientConsultingSheetDetails } from '../../models/PatientConsultingSheetdetails';
import { PicasoAdviceList } from '../../models/AdviceList';
import { Sequelize } from 'sequelize-typescript';
import { PrescriptionService } from '../Prescription/Prescription.service';
import { GlobalHelper } from '../../helper/global.helper';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';

import { OhcVitals } from '../../models/ohcVitals.model';

import { OHCClinicalExamination } from '../../models/OHCClinicalExamination.model';

import { OHCLabInvestigation } from '../../models/OHCLabInvestigation.model';

import { OHCLabTestResult } from '../../models/OHCLabTestResult.model';

import { OHCRadiology } from '../../models/OHCRadiology.model';
import { OHCRadiologyTestResult } from '../../models/OHCRadiologyTestResult.model';
import { buildScopeWhere } from 'src/helper/auth.helper';
@Injectable()
export class PicasoidPrescriptionService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(PicasoPatientConsultingSheetDetails)
    private readonly prescriptionDetail: typeof PicasoPatientConsultingSheetDetails,

    @InjectModel(PicasoAdviceList)
    private readonly picasoAdviceList: typeof PicasoAdviceList,
    private readonly prescriptionService: PrescriptionService,
    @InjectModel(driverhealthcheckup)
    private readonly healthModel: typeof driverhealthcheckup,

    @InjectModel(OhcVitals)
    private readonly vitalsModel: typeof OhcVitals,

    @InjectModel(OHCClinicalExamination)
    private readonly clinicalModel: typeof OHCClinicalExamination,

    @InjectModel(OHCLabInvestigation)
    private readonly labModel: typeof OHCLabInvestigation,

    @InjectModel(OHCLabTestResult)
    private readonly labTestModel: typeof OHCLabTestResult,

    @InjectModel(OHCRadiology)
    private readonly radiologyModel: typeof OHCRadiology,

    @InjectModel(OHCRadiologyTestResult)
    private readonly radiologyTestModel: typeof OHCRadiologyTestResult,
  ) {}

  async getPrescriptionList(requestingUser: any, query: any = {}) {
    try {
      const {
        bill_no,
        Name_,
        mobileno,
        status = true,
        date_from,
        date_to,
        page = 1,
        limit = 10,
        ID,
      } = query;

      const pageNumber = Number(page);
      const pageSize = Number(limit);
      const offset = (pageNumber - 1) * pageSize;
      const scopeWhere = buildScopeWhere(
        {
          id: requestingUser.id,
          role: requestingUser.role,
          tenant_id: requestingUser.tenantId,
          center_id: requestingUser.centerId,
        },
        this.prescriptionDetail,
      );
      const where: WhereOptions = {
        ...scopeWhere,
      };

      const hasAnyFilter =
        !!bill_no ||
        !!Name_ ||
        !!mobileno ||
        status !== undefined ||
        !!date_from ||
        !!date_to ||
        ID;
      if (bill_no) {
        where['billNo'] = { [Op.iLike]: `%${bill_no}%` };
      }

      if (Name_) {
        where['patientName'] = { [Op.iLike]: `%${Name_}%` };
      }

      if (mobileno) {
        where['contactNo'] = { [Op.iLike]: `%${mobileno}%` };
      }

      // if (status !== undefined) {
      //   where['isActive'] = status === true || status === 'true';
      // }
      if (
  status !== undefined &&
  status !== null &&
  status !== ""
) {
  where['isActive'] = status === true || status === 'true';
}

      if (ID !== undefined) {
        where['ID'] = ID;
      }

      if (date_from && date_to) {
        where['addedDate'] = {
          [Op.between]: [new Date(date_from), new Date(date_to)],
        };
      } else if (date_from) {
        where['addedDate'] = { [Op.gte]: new Date(date_from) };
      } else if (date_to) {
        where['addedDate'] = { [Op.lte]: new Date(date_to) };
      }

      // 🔥 Default: today if NO filters
      if (!hasAnyFilter) {
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        const end = new Date();
        end.setHours(23, 59, 59, 999);

        where['addedDate'] = {
          [Op.between]: [start, end],
        };
      }

      const { rows, count } = await this.prescriptionDetail.findAndCountAll({
        where,
        include: [{ model: PicasoAdviceList, required: false }],
        order: [['addedDate', 'DESC']],
        limit: pageSize,
        offset,
        distinct: true, // 🔥 IMPORTANT when using include
      });

      const consultingId = rows[0]?.consultingId;

      const enrichedRows = await Promise.all(
        rows.map(async (row) => {
          const [doctor] = await this.sequelize.query(
            `
      SELECT d.user_id, d.registration_number, d.qualification, u.name
      FROM "Doctors" d
      LEFT JOIN "Users" u ON d.user_id = u.id
      WHERE d.id = :id
      `,
            {
              replacements: { id: Number(row.consultingId) },
              type: QueryTypes.SELECT,
            },
          );
          const [addressData] = await this.sequelize.query(
  `
    SELECT dm."localAddress"
    FROM "opd_billing" ob
    INNER JOIN "DRIVERMASTERs" dm
      ON dm.id = ob."PatientID"
    WHERE ob."ID" = :billNo
    LIMIT 1
  `,
  {
    replacements: {
      billNo: Number(row.billNo),
    },
    type: QueryTypes.SELECT,
  },
);
return {
  ...row.toJSON(),
  doctor,
 address: (addressData as any)?.localAddress || "",
  addedDate: row.addedDate
    ? row.addedDate.toLocaleString("sv-SE", {
      timeZone: "Asia/Kolkata",
    })
    : null,

};

          
        }),
      );

      return {
        data: enrichedRows,
        pagination: {
          currentPage: pageNumber,
          pageSize,
          totalRecords: count,
          totalPages: Math.ceil(count / pageSize),
        },
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to fetch prescription list',
      );
    }
  }

  // async savePrescription(requestingUser: any, payload: any) {
  //   const transaction = await this.sequelize.transaction();
  //   const addedby = requestingUser.id;
  //   const tenant_id = requestingUser.tenantId;
  //   const center_id = requestingUser.centerId;
  //   try {
  //     const { AdviceList = [], ID, ...prescriptionData } = payload;

  //     let prescription;

  //     if (ID) {
  //       prescription = await this.prescriptionDetail.findByPk(ID, {
  //         transaction,
  //       });

  //       if (!prescription) {
  //         throw new NotFoundException('Prescription not found');
  //       }

  //       await prescription.update(
  //         {
  //           ...prescriptionData,
  //           modifiedDate: new Date(),
  //         },
  //         { transaction },
  //       );

  //       // Delete old advice entries
  //       await this.picasoAdviceList.destroy({
  //         where: { PrescriptionID: ID },
  //         transaction,
  //       });
  //       if (AdviceList.length > 0) {
  //         const adviceRecords = AdviceList.map((item) => ({
  //           ...item,
  //           PrescriptionID: ID,
  //           tenant_id,
  //           center_id,
  //           AddedBy: addedby,
  //         }));
  //         await this.picasoAdviceList.bulkCreate(adviceRecords, {
  //           transaction,
  //         });
  //       }
  //     } else {
  //       const createPayload = {
  //         ...prescriptionData,
  //         tenant_id,
  //         center_id,
  //         AddedBy: addedby,
  //       };
  //       prescription = await this.prescriptionDetail.create(
  //         {
  //           createPayload,
  //         },
  //         { transaction },
  //       );

  //       if (AdviceList.length > 0) {
  //         const adviceRecords = AdviceList.map((item) => ({
  //           ...item,
  //           PrescriptionID: prescription.ID,
  //           tenant_id,
  //           center_id,
  //           AddedBy: addedby,
  //         }));

  //         await this.picasoAdviceList.bulkCreate(adviceRecords, {
  //           transaction,
  //         });
  //       }
  //     }

  //     await transaction.commit();
  //     const data = { ...prescriptionData };
  //     const createData = {
  //       doctor_id: data.doctor_id,
  //       driver_id: data.driver_id,
  //       other_lab: data.otherLabs,
  //       follow_up: data.nextFollowup,
  //       isReady: true,
  //       vitals: {
  //         spo2: data.spo2,
  //         pulse: data.pulseRate,
  //         height: data.height,
  //         weight: data.weight,
  //         systolicBP: data.bpSystolic,
  //         diastolicBP: data.bpDiastolic,
  //         temperature: data.temperature,
  //       },
  //       diagnose: data.treatmentPlan,
  //       chief_complaints: data.chiefComplaints,
  //       preventive_advice: data.preventiveAdvice,
  //       drug_allergies: data.history,
  //       instructions: data.otherInstructions,
  //       lab: data.labs,
  //       bil_no: data.billNo,
  //     };
  //     // This code we will need to uncomment after the fixing the consultaion login in our system
  //     // await this.prescriptionService.createPrescription(createData, true);
  //     return {
  //       message: ID
  //         ? 'Prescription updated successfully'
  //         : 'Prescription created successfully',
  //       PrescriptionID: prescription.ID,
  //     };
  //   } catch (error) {
  //     await transaction.rollback();
  //     console.error(error);
  //     throw new InternalServerErrorException('Failed to save prescription');
  //   }
  // }
  async savePrescription(requestingUser: any, payload: any) {
    const transaction = await this.sequelize.transaction();

    const addedby = requestingUser.id;
    const tenant_id = requestingUser.tenantId;
    const center_id = requestingUser.centerId;

    try {
      const { AdviceList = [], ID, ...prescriptionData } = payload;

      let prescription: any;
      const scopeWhere = buildScopeWhere(
        {
          id: requestingUser.id,
          role: requestingUser.role,
          tenant_id,
          center_id,
        },
        this.prescriptionDetail,
      );

      if (ID) {
        prescription = await this.prescriptionDetail.findOne({
          where: {
            ID,
            ...scopeWhere,
          },
          transaction,
        });

        if (!prescription) {
          throw new NotFoundException(
            'Prescription not found or access denied',
          );
        }

        await prescription.update(
          {
            ...prescriptionData,
             modifiedDate: Sequelize.literal("timezone('Asia/Kolkata', now())"),
          },
          { transaction },
        );

        await this.picasoAdviceList.destroy({
          where: {
            PrescriptionID: ID,
          },
          transaction,
        });

        if (AdviceList.length > 0) {
          const adviceRecords = AdviceList.map((item) => ({
            ...item,
            PrescriptionID: ID,
            tenant_id,
            center_id,
            AddedBy: addedby,
          }));

          await this.picasoAdviceList.bulkCreate(adviceRecords, {
            transaction,
          });
        }
      } else {
        const createPayload = {
          ...prescriptionData,
          tenant_id,
          center_id,
          AddedBy: addedby,
        };

        prescription = await this.prescriptionDetail.create(createPayload, {
  transaction,
});



if (AdviceList.length > 0) {
  const adviceRecords = AdviceList.map((item) => ({
    ...item,
    PrescriptionID: prescription.ID,
     
    tenant_id,
    center_id,
    AddedBy: addedby,
  }));

  

          await this.picasoAdviceList.bulkCreate(adviceRecords, {
            transaction,
          });
        }
      }

      await transaction.commit();

      const data = { ...prescriptionData };

      const createData = {
        doctor_id: data.doctor_id,
        driver_id: data.driver_id,
        other_lab: data.otherLabs,
        follow_up: data.nextFollowup,
        isReady: true,

        vitals: {
          spo2: data.spo2,
          pulse: data.pulseRate,
          height: data.height,
          weight: data.weight,
          systolicBP: data.bpSystolic,
          diastolicBP: data.bpDiastolic,
          temperature: data.temperature,
        },

        diagnose: data.treatmentPlan,
        chief_complaints: data.chiefComplaints,
        preventive_advice: data.preventiveAdvice,
        drug_allergies: data.history,
        instructions: data.otherInstructions,
        lab: data.labs,
        bil_no: data.billNo,
      };

      // await this.prescriptionService.createPrescription(createData, true);

      return {
        message: ID
          ? 'Prescription updated successfully'
          : 'Prescription created successfully',

        PrescriptionID: prescription.ID,
      };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        error?.message || 'Failed to save prescription',
      );
    }
  }
  async getAllForExport(user: any, query: any) {
      const hasAnyFilter =
    !!query.bill_no ||
    !!query.Name_ ||
    !!query.mobileno ||
    (query.status !== undefined &&
      query.status !== null &&
      query.status !== "") ||
    !!query.date_from ||
    !!query.date_to ||
    !!query.ID;

  if (!hasAnyFilter) {
    const start = new Date();
    start.setHours(0,0,0,0);

    const end = new Date();
    end.setHours(23,59,59,999);

    query = {
      ...query,
      date_from: start.toISOString(),
      date_to: end.toISOString(),
    };
  }
    return this.getPrescriptionList(user, {
      ...query,
      page: 1,
      limit: 10000,
    });
  }

  async exportPrescriptionExcel(user: any, query: any) {
    const result = await this.getAllForExport(user, query);
    const rows = Array.isArray(result?.data) ? result.data : [];

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Prescriptions');
   
    const { date_from, date_to } = query;

    // ===== Title =====
    sheet.mergeCells('A1:Q1');
    const title = sheet.getCell('A1');
    title.value = 'Prescription List';
    title.font = { bold: true, size: 16 };
    title.alignment = { horizontal: 'center' };

    // ===== Filter info =====
    sheet.mergeCells('A2:Q2');
    const filterCell = sheet.getCell('A2');
    filterCell.value =
      date_from && date_to
        ? `Filtered: ${new Date(date_from).toLocaleDateString()} → ${new Date(
            date_to,
          ).toLocaleDateString()}`
        : 'Filtered: All Records';

    filterCell.font = { italic: true, color: { argb: '555555' } };
    filterCell.alignment = { horizontal: 'center' };

    sheet.addRow([]);

    sheet.columns = [
      { key: 's_no', width: 8 },
      { key: 'billNo', width: 15 },
      { key: 'picasoId', width: 15 },
      { key: 'patientName', width: 25 },
      { key: 'age', width: 8 },
      { key: 'gender', width: 10 },
      { key: 'contactNo', width: 15 },
      { key: 'patientType', width: 15 },
      { key: 'bpSystolic', width: 15 },
      { key: 'bpDiastolic', width: 15 },
      { key: 'pulseRate', width: 10 },
      { key: 'spo2', width: 10 },
      { key: 'temperature', width: 15 },
      { key: 'height', width: 12 },
      { key: 'weight', width: 12 },
      { key: 'addedDate', width: 20 },
      // { key: 'doctor_name', width: 20 },
    ];

    const headerRow = sheet.addRow([
      'S No',
      'Bill No',
      'UHID',
      'Patient Name',
      'Age',
      'Gender',
      'Mobile No',
      'Fin. Cat',
      'BP Systolic',
      'BP Diastolic',
      'Pulse',
      'SPO2',
      'Temperature',
      'Height',
      'Weight',
      'Date',
      // 'Doctor',
    ]);

    headerRow.font = { bold: true };
    headerRow.alignment = { horizontal: 'center' };

    headerRow.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // ===== Data rows =====
    let counter = 1;

    for (const row of rows) {
      sheet.addRow({
        s_no: counter++,
        billNo: row.billNo ?? '',
        picasoId: row.picasoId ?? '',
        patientName: row.patientName ?? '',
        age: row.age ?? '',
        gender: row.gender ?? '',
        contactNo: row.contactNo ?? '',
        patientType: row.patientType ?? '',
        bpSystolic: row.bpSystolic ?? '',
        bpDiastolic: row.bpDiastolic ?? '',
        pulseRate: row?.pulseRate ?? '',
        spo2: row.spo2 ?? '',
        temperature: row.temperature ?? '',
        height: row.height ?? '',
        weight: row.weight ?? '',
        addedDate: row.addedDate
          ? new Date(row.addedDate).toISOString().slice(0, 10)
          : '',
        // doctor_name: 'Pawan',
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  async toggleStatus(id: number) {
    const [affectedCount] = await this.prescriptionDetail.update(
      {
        isActive: this.sequelize.literal(`NOT "IsActive"`),
      },
      {
        where: { ID: id },
      },
    );

    if (!affectedCount) {
      throw new NotFoundException(
        `Prescription detail with ID ${id} not found`,
      );
    }

    return { message: 'Status toggled successfully' };
  }
  async saveOhcCombined(body: any, req: any) {
    return this.sequelize.transaction(async (transaction) => {
      const patient = body.patient;
      const healthCheckup = await this.healthModel.create(
        {
          driver_id: body.patient.patient_id,

          createdBy: req.user.id,

          selected_package_name: body.selected_package_name,

          selected_package_list: body.selected_package_list,

          package_list: body.package_list,

          // blood_pressure_unit:
          //   body.blood_pressure_unit,

          // pulse_unit:
          //   body.pulse_unit,

          // spo2_unit:
          //   body.spo2_unit,

          // bmi_unit:
          //   body.bmi_unit,

          // temperature_unit:
          //   body.temperature_unit,

          selected_test: {
            patient: body.patient,

            vitals: body.vitals,

            clinical_examination: body.clinical_examination,

            laboratory: body.laboratory,

            radiology: body.radiology,
          },

          is_submited: true,
        },
        { transaction },
      );
      await this.vitalsModel.create(
        {
          patient_id: patient.patient_id,

          name: patient.name,

          gender: patient.gender,

          age: patient.age,

          employee_id: patient.employee_id,
          ...body.vitals,
        },
        { transaction },
      );

      await this.clinicalModel.create(
        {
          patient_id: patient.patient_id,

          name: patient.name,

          gender: patient.gender,

          age: patient.age,

          employee_id: patient.employee_id,
          ...body.clinical_examination,

          created_by: req.user.id,
        },
        { transaction },
      );

      const lab = await this.labModel.create(
        {
          patient_id: patient.patient_id,

          name: patient.name,

          gender: patient.gender,

          age: patient.age,

          employee_id: patient.employee_id,

          investigation_date: body.laboratory.investigation_date,

          remarks: body.laboratory.remarks,

          created_by: req.user.id,
        },
        { transaction },
      );
      if (body.laboratory.tests?.length) {
        await this.labTestModel.bulkCreate(
          body.laboratory.tests.map((item) => ({
            investigation_id: lab.id,

            test_name: item.test_name,

            result_value: item.result_value,

            normal_range: item.normal_range,

            remarks: item.remarks,

            report_url: item.report_url,

            created_by: req.user.id,
          })),

          { transaction },
        );
      }
      const radiology = await this.radiologyModel.create(
        {
          patient_id: patient.patient_id,

          name: patient.name,

          gender: patient.gender,

          age: patient.age,

          employee_id: patient.employee_id,

          created_by: req.user.id,
        },
        { transaction },
      );

      if (body.radiology.tests?.length) {
        await this.radiologyTestModel.bulkCreate(
          body.radiology.tests.map((item) => ({
            radiology_id: radiology.id,

            test_type: item.test_type,

            result_summary: item.result_summary,

            doctor_remarks: item.doctor_remarks,

            report_url: item.report_url,

            created_by: req.user.id,
          })),

          { transaction },
        );
      }

      return {
        success: true,

        message: 'Patient Examination Details Saved Successfully',

        data: {
          healthCheckup,
        },
      };
    });
  }

  // async getOhcCombinedList() {

  //   try {

  //     const data = await this.healthModel.findAll({

  //       attributes: [
  //         "id",
  //         "selected_test",
  //         "selected_package_name",
  //         "createdAt",
  //       ],

  //       where: {
  //         is_submited: true,
  //       },

  //       order: [["createdAt", "DESC"]],

  //       raw: true,
  //     });

  //     return {
  //       success: true,
  //       data,
  //     };

  //   } catch (error) {

  //     console.log(error);

  //     throw new InternalServerErrorException(
  //       "Failed to fetch records",
  //     );
  //   }
  // }
  async getOhcCombinedList(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const data = await this.healthModel.findAll({
      where: {
        is_submited: true,
      },

      limit: Number(limit),

      offset: Number(offset),

      order: [['createdAt', 'DESC']],
    });

    return {
      success: true,
      data,
    };
  }

  async getOhcCombinedById(id: number) {
    try {
      const data = await this.healthModel.findByPk(id);

      if (!data) {
        throw new NotFoundException('Record not found');
      }

      return {
        success: true,

        data,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch record');
    }
  }
  async updateOhcCombined(id: number, body: any, req: any) {
    return this.sequelize.transaction(async (transaction) => {
      const healthCheckup = await this.healthModel.findByPk(id, {
        transaction,
      });
      if (!healthCheckup) {
        throw new NotFoundException('Record not found');
      }
      const patient = body.patient;
      const patient_id = patient.patient_id;
      await healthCheckup.update(
        {
          selected_package_name: body.selected_package_name,
          selected_test: {
            patient: body.patient,
            vitals: body.vitals,
            clinical_examination: body.clinical_examination,
            laboratory: body.laboratory,
            radiology: body.radiology,
          },
        },
        { transaction },
      );
      const vitalsRecord = await this.vitalsModel.findOne({
        where: { patient_id },
        order: [['created_at', 'DESC']],
        transaction,
      });
      if (vitalsRecord) {
        await vitalsRecord.update(
          {
            ...body.vitals,
            patient_id,
            name: patient.name,
            gender: patient.gender,
            age: patient.age,
            employee_id: patient.employee_id,
          },
          { transaction },
        );
      }
      const clinicalRecord = await this.clinicalModel.findOne({
        where: { patient_id },
        order: [['created_at', 'DESC']],
        transaction,
      });
      if (clinicalRecord) {
        await clinicalRecord.update(
          {
            ...body.clinical_examination,
            patient_id,
            name: patient.name,
            gender: patient.gender,
            age: patient.age,
            employee_id: patient.employee_id,
            created_by: req.user.id,
          },
          { transaction },
        );
      }
      const labRecord = await this.labModel.findOne({
        where: { patient_id },
        order: [['created_at', 'DESC']],
        transaction,
      });
      if (labRecord) {
        await this.labTestModel.destroy({
          where: { investigation_id: labRecord.id },
          transaction,
        });

        if (body.laboratory.tests?.length) {
          await this.labTestModel.bulkCreate(
            body.laboratory.tests.map((item) => ({
              investigation_id: labRecord.id,
              test_name: item.test_name,
              result_value: item.result_value,
              normal_range: item.normal_range,
              remarks: item.remarks,
              report_url: item.report_url,
              created_by: req.user.id,
            })),
            { transaction },
          );
        }
      }
      const radiologyRecord = await this.radiologyModel.findOne({
        where: { patient_id },
        order: [['created_at', 'DESC']],
        transaction,
      });
      if (radiologyRecord) {
        await this.radiologyTestModel.destroy({
          where: { radiology_id: radiologyRecord.id },
          transaction,
        });

        if (body.radiology.tests?.length) {
          await this.radiologyTestModel.bulkCreate(
            body.radiology.tests.map((item) => ({
              radiology_id: radiologyRecord.id,
              test_type: item.test_type,
              result_summary: item.result_summary,
              doctor_remarks: item.doctor_remarks,
              report_url: item.report_url,
              created_by: req.user.id,
            })),
            { transaction },
          );
        }
      }

      return {
        success: true,
        message: 'Patient Examination Details Updated Successfully',
      };
    });
  }

  async softDeleteOhcCombined(id: number) {
    return this.sequelize.transaction(async (transaction) => {
      const record = await this.healthModel.findByPk(id, { transaction });
      if (!record) {
        throw new NotFoundException('Record not found');
      }

      const patient_id = record.driver_id;

      await record.update({ is_submited: false }, { transaction });

      if (patient_id) {
        await this.vitalsModel.update(
          { is_deleted: true },
          { where: { patient_id }, transaction },
        );

        await this.clinicalModel.update(
          { is_deleted: true },
          { where: { patient_id }, transaction },
        );

        const labRecords = await this.labModel.findAll({
          where: { patient_id },
          transaction,
        });

        for (const lab of labRecords) {
          await this.labTestModel.update(
            { is_deleted: true },
            { where: { investigation_id: lab.id }, transaction },
          );
        }

        await this.labModel.update(
          { is_deleted: true },
          { where: { patient_id }, transaction },
        );

        const radiologyRecords = await this.radiologyModel.findAll({
          where: { patient_id },
          transaction,
        });

        for (const rad of radiologyRecords) {
          await this.radiologyTestModel.update(
            { is_deleted: true },
            { where: { radiology_id: rad.id }, transaction },
          );
        }

        await this.radiologyModel.update(
          { is_deleted: true },
          { where: { patient_id }, transaction },
        );
      }

      return {
        success: true,
        message: 'Record deleted successfully',
      };
    });
  }
}
