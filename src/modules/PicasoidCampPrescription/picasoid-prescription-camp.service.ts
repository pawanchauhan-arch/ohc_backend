import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions, QueryTypes } from 'sequelize';
import { PicasoPatientCampConsultingSheetDetails } from '../../models/PatientCampConsultingSheetdetails';
import { PicasoCampAdviceList } from '../../models/CampAdviceList';
import { Sequelize } from 'sequelize-typescript';
import { PrescriptionService } from '../Prescription/Prescription.service';
import { GlobalHelper } from '../../helper/global.helper';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { buildScopeWhere } from 'src/helper/auth.helper';
@Injectable()
export class PicasoidCampPrescriptionService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(PicasoPatientCampConsultingSheetDetails)
    private readonly prescriptionDetail: typeof PicasoPatientCampConsultingSheetDetails,

    @InjectModel(PicasoCampAdviceList)
    private readonly  picasoCampAdviceList: typeof PicasoCampAdviceList,
    private readonly prescriptionService: PrescriptionService,
    @InjectModel(driverhealthcheckup)
    private readonly healthModel: typeof driverhealthcheckup,
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
        include: [{ model: this.picasoCampAdviceList, required: false }],
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

        await this.picasoCampAdviceList.destroy({
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

          await this.picasoCampAdviceList.bulkCreate(adviceRecords, {
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

  

          await this.picasoCampAdviceList.bulkCreate(adviceRecords, {
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
}
