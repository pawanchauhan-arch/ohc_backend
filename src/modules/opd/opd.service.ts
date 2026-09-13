import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize, Op, QueryTypes } from 'sequelize';
import { OPDBilling } from '../../models/OpdBilling';
import { OPDBillDetail } from '../../models/OpdBillingDetails';
import { ViewOpdBillingSummary } from '../../models/viewOpdBilling';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { buildScopeWhere } from 'src/helper/auth.helper';
import { PicasoOpdDailyPatientListModel } from 'src/models/PicasoOpdDailyPatientList';
import { InjectConnection } from '@nestjs/sequelize';
import { PicasoPharmacyRevenueModel } from 'src/models/PharmacyRevenue';
import { PicasoSpectacleRevenueModel } from 'src/models/SpectacleRevenue';
import { PicasoOpdPhrgBillHeaderModel } from 'src/models/MedicineOpdBillHeader';
import { PicasoOpdPhrfBillFooterModel } from 'src/models/MedicineOpdBillFooter';

@Injectable()
export class OpdBillingService {
  constructor(
    // private readonly sequelize: Sequelize,
    @InjectConnection()
    private readonly sequelize: Sequelize,

    @InjectModel(OPDBilling)
    private readonly billingModel: typeof OPDBilling,

    @InjectModel(OPDBillDetail)
    private readonly billDetailModel: typeof OPDBillDetail,

    @InjectModel(ViewOpdBillingSummary)
    private readonly viewModel: typeof ViewOpdBillingSummary,

    @InjectModel(DRIVERMASTER)
    private readonly driverMasterModel: typeof DRIVERMASTER,

    @InjectModel(PicasoOpdDailyPatientListModel)
    private readonly picasoOpdDailyPatientListModel: typeof PicasoOpdDailyPatientListModel,

    @InjectModel(PicasoPharmacyRevenueModel)
    private readonly pharmacyRevenueModel: typeof PicasoPharmacyRevenueModel,

    @InjectModel(PicasoSpectacleRevenueModel)
    private readonly spectacleRevenueModel: typeof PicasoSpectacleRevenueModel,

    @InjectModel(PicasoOpdPhrgBillHeaderModel)
    private readonly picasoOpdPhrgBillHeaderModel: typeof PicasoOpdPhrgBillHeaderModel,

    @InjectModel(PicasoOpdPhrfBillFooterModel)
    private readonly picasoOpdPhrfBillFooterModel: typeof PicasoOpdPhrfBillFooterModel,
  ) {}

  async createBill(requestingUser: any, data: any) {
    const transaction = await this.billingModel.sequelize.transaction();
    const addedBy = requestingUser?.id;

    try {
      const centerId = requestingUser?.centerId;
      const now = new Date();
      const todayStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
      );
      const todayEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
      );
      todayStart.setHours(todayStart.getHours() - 5.5);
      todayEnd.setHours(todayEnd.getHours() - 5.5);
      const countToday = await this.billingModel.count({
        where: {
          center_id: centerId,
          AddedDate: {
            [Op.between]: [todayStart, todayEnd],
          },
        },
        transaction,
      });

      const tokenNo = countToday + 1;

      data.header.token = tokenNo;
      data.header.AddedBy = addedBy;
      data.header.center_id = centerId;
      data.header.tenant_id = requestingUser?.tenantId;
      
const isPreviousDueClearance = data.details?.some(
  (detail) => detail.ServiceName === 'Previous Due Clearance',
);

if (isPreviousDueClearance) {
  const clearanceAmount = Number(data.header.PaidAmount || 0);
  const uhid = data.header.PicasoNo;

  if (clearanceAmount > 0 && uhid) {
    const previousBill = await this.billingModel.findOne({
      where: {
        PicasoNo: uhid,
        DueAmount: {
          [Op.gt]: 0,
        },
        IsActive: true,
      },
      order: [['ID', 'DESC']],
      transaction,
    });

    if (previousBill) {
      const oldDueAmount = Number(previousBill.DueAmount || 0);

      const amountToAdjust = Math.min(
        clearanceAmount,
        oldDueAmount,
      );

      await previousBill.update(
        {
          
          DueAmount: oldDueAmount - amountToAdjust,
        },
        { transaction },
      );
    }
  }
}


      const bill = await this.billingModel.create(data.header, { transaction });
      const dailyPatient = await this.picasoOpdDailyPatientListModel.findOne({
        where: {
          PatientID: bill.PatientID,
          IsActive: true,
        },
        order: [['DailyID', 'DESC']],
        transaction,
      });

      if (dailyPatient) {
        await dailyPatient.update(
          {
            DepartmentID: bill.DepartmentID,
            Visitype: Number(bill.Visitype),
            ConsultantDoctorID: bill.ConsultantDoctorID,
          },
          { transaction },
        );
      }

      if (data.details && data.details.length > 0) {
        for (const detail of data.details) {
          detail.BillNo = bill.ID;
          detail.center_id = centerId;
          detail.tenant_id = requestingUser?.tenantId;
          detail.AddedBy = addedBy;
          await this.billDetailModel.create(detail, { transaction });
        }
      }

      await transaction.commit();
      return {
        message: 'Bill created successfully',
        billId: bill.ID,
        token: tokenNo,
      };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        error.message || 'Failed to create bill',
      );
    }
  }

  async getAllBills(
    requestingUser: any,
    query: {
      PatientID?: string;
      ServiceTypeID?: string;
      HospitalID?: string;
      IsActive?: string | boolean;
      bill_no?: string;
      limit?: string;
      page?: string;
      id?: number;
      centerIds?: number[];
    },
  ) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.billingModel,
    );
    const where: any = {
      ...scopeWhere,
    };

    if (query.PatientID) where.PatientID = query.PatientID;
    if (query.ServiceTypeID) where.ServiceTypeID = query.ServiceTypeID;
    if (query.HospitalID) where.HospitalID = query.HospitalID;

    if (query.IsActive !== undefined) {
      where.IsActive = query.IsActive === true || query.IsActive === 'true';
    }

    if (query.bill_no) {
      where[Op.and] = [
        Sequelize.where(
          Sequelize.cast(Sequelize.col('OPDBilling.ID'), 'TEXT'),
          {
            [Op.like]: `%${query.bill_no}%`,
          },
        ),
      ];
    }

    const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 100);
    const page = Math.max(Number(query.page) || 1, 1);
    const offset = (page - 1) * limit;

    return this.billingModel.findAll({
      where,
      include: [
        {
          model: this.billDetailModel,
          required: false,
        },
      ],
      order: [['ID', 'DESC']],
      limit,
      offset,
    });
  }

  async getBillById(requestingUser: any, id: number) {
    const bill = await this.billingModel.findByPk(id, {
      include: [
        { model: this.billDetailModel, required: false },
        { model: this.driverMasterModel, required: false },
      ],
    });
    if (!bill) throw new NotFoundException(`Bill with ID ${id} not found`);
    return bill;
  }

  async updateBill(requestingUser: any, id: number, data: any) {
    const transaction = await this.billingModel.sequelize.transaction();
    try {
      const bill = await this.billingModel.findByPk(id);
      if (!bill) throw new NotFoundException('Bill not found');
      data.header.ModifiedBy = requestingUser.id;
      data.header.ModifiedDate = this.sequelize.literal(
        "timezone('Asia/Kolkata', now())",
      );
      await bill.update(data.header, { transaction });

      if (data.details && data.details.length > 0) {
        await this.billDetailModel.destroy({
          where: { BillNo: id },
          transaction,
        });
        for (const detail of data.details) {
          detail.BillNo = id;
          await this.billDetailModel.create(detail, { transaction });
        }
      }

      await transaction.commit();
      return { message: 'Bill updated successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteBill(id: number) {
    const transaction = await this.billingModel.sequelize.transaction();
    try {
      const bill = await this.billingModel.findByPk(id);
      if (!bill) throw new NotFoundException('Bill not found');

      await this.billDetailModel.destroy({
        where: { BillNo: id },
        transaction,
      });
      await this.billingModel.destroy({ where: { ID: id }, transaction });

      await transaction.commit();
      return { message: 'Bill deleted successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(error.message);
    }
  }
  async updateBillDetail(id: number, updateData: any) {
    const transaction = await this.billDetailModel.sequelize.transaction();
    try {
      const detail = await this.billDetailModel.findByPk(id);
      if (!detail) throw new NotFoundException('Bill detail not found');

      await detail.update(updateData, { transaction });

      await transaction.commit();
      return { message: 'Bill detail updated successfully', detail };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(error.message);
    }
  }

  async deleteBillDetail(id: number) {
    const transaction = await this.billDetailModel.sequelize.transaction();
    try {
      const deletedCount = await this.billDetailModel.destroy({
        where: { Id: id },
        transaction,
      });

      if (deletedCount === 0)
        throw new NotFoundException('Bill detail not found');

      await transaction.commit();
      return { message: 'Bill detail deleted successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(error.message);
    }
  }

  async viewOpdBilling(requestingUser: any, filters: any) {
    const {
      page = 1,
      limit = 20,
      doctor: doctor_name,
      name: patient_name,
      center_name,
      bill_status,
      startDate: fromDate,
      endDate: toDate,
      contactNumber: mobile,
      external_id: uhid,
      department: department_name,
      payment_mode,
      added_by,
      gender,
      category: patient_type,
      idProof_number: unique_number,
      bill_no: bill_no,
    } = filters;

    const offset = (page - 1) * limit;
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.viewModel,
    );
    const where: any = {
      ...scopeWhere,
    };
    const orSymbol = Object.getOwnPropertySymbols(where).find(
      (sym) => sym.description === 'or',
    );

    if (orSymbol) {
      const innerOrSymbol = Object.getOwnPropertySymbols(where[orSymbol]).find(
        (sym) => sym.description === 'or',
      );

      if (innerOrSymbol && Array.isArray(where[orSymbol][innerOrSymbol])) {
        where[orSymbol][innerOrSymbol] = where[orSymbol][innerOrSymbol].map(
          (condition: any) => {
            const { added_by, ...rest } = condition;
            return rest;
          },
        );
      }
    }

    const hasUserFilters = Object.values({
      doctor_name,
      patient_name,
      center_name,
      bill_status,
      fromDate,
      toDate,
      mobile,
      uhid,
      department_name,
      payment_mode,
      added_by,
      gender,
      patient_type,
      unique_number,
      bill_no,
    }).some((v) => v !== undefined && v !== null && v !== '');

    if (!hasUserFilters) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      where.AddedDate = { [Op.between]: [start, end] };
    }

    if (doctor_name) where.doctor_name = { [Op.iLike]: `%${doctor_name}%` };
    if (patient_name) where.patient_name = { [Op.iLike]: `%${patient_name}%` };
    if (center_name) where.center_name = { [Op.iLike]: `%${center_name}%` };
    if (mobile) where.contactNumber = { [Op.iLike]: `%${mobile}%` };
    if (uhid) where.uhid = { [Op.iLike]: `%${uhid}%` };
    if (department_name)
      where.department_name = { [Op.iLike]: `%${department_name}%` };
    // if (added_by) where.added_by = { [Op.iLike]: `%${added_by}%` };
    if (patient_type) where.patient_type = { [Op.iLike]: `%${patient_type}%` };
    if (payment_mode) where.payment_mode = { [Op.iLike]: `%${payment_mode}%` };
    if (gender) {
      where.gender = gender;
    }

    if (added_by) {
      where.added_by = { [Op.iLike]: `%${added_by}%` };
    }
    if (unique_number)
      where.unique_number = { [Op.iLike]: `%${unique_number}%` };

    if (bill_status !== undefined) where.bill_status = bill_status;
    if (bill_no) where.bill_no = Number(bill_no);

    const parseDate = (val: string): Date | null => {
      if (!val) return null;

      const [year, month, day] = val.split('-').map(Number);

      const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);

      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const from = parseDate(fromDate);
    const to = parseDate(toDate);
    if (from && to) {
      const end = new Date(to);
      end.setDate(end.getDate() + 1);
      where.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (from && !to) {
      const end = new Date(from);
      end.setDate(end.getDate() + 1);
      where.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (!from && to) {
      const start = new Date(to);
      const end = new Date(to);
      end.setDate(end.getDate() + 1);
      where.AddedDate = {
        [Op.gte]: start,
        [Op.lt]: end,
      };
    }

    const { rows, count } = await this.viewModel.findAndCountAll({
      where,
      limit: +limit,
      offset,
      order: [['bill_no', 'DESC']],
    });
    const allRows = await this.viewModel.findAll({
      where,
    });
    const totalBillAmount = allRows.reduce(
      (sum, row: any) => sum + Number(row.TotalServiceAmount || 0),
      0,
    );

    const totalPaidAmount = allRows.reduce(
      (sum, row: any) => sum + Number(row.PaidAmount || 0),
      0,
    );

    const totalDueAmount = allRows.reduce(
      (sum, row: any) => sum + Number(row.DueAmount || 0),
      0,
    );

    let totalCashAmount = 0;
    let totalUpiAmount = 0;

    allRows.forEach((row: any) => {
      switch (row.payment_mode) {
        case 'Cash Payment':
          totalCashAmount += Number(row.PaidAmount || 0);
          break;

        case 'Cash/Online Payment':
          totalCashAmount += Number(row.CashAmount || 0);
          totalUpiAmount += Number(row.CardAmount || 0);
          break;

        case 'UPI':
        case 'Card Payment':
        case 'Cost Free':
          totalUpiAmount += Number(row.PaidAmount || 0);
          break;
      }
    });
    const pharmaResult = await this.getPharmacyRevenue(
      requestingUser,
      from,
      to,
    );
    const specResult = await this.getSpectRevenue(requestingUser, from, to);

    const grandTotal =
      totalBillAmount +
      pharmaResult?.pharmacyRevenue +
      specResult.spectacleRevenue;

    const grandPaid =
      totalPaidAmount + pharmaResult.pharmacyPaid + specResult.spectaclePaid;

    const grandDue =
      totalDueAmount + pharmaResult?.pharmacyDue + specResult.spectacleDue;

    const grandCash =
      totalCashAmount + pharmaResult?.pharmacyCash + specResult.spectacleCash;

    const grandUpi =
      totalUpiAmount + pharmaResult?.pharmacyUpi + specResult.spectacleUpi;

    const enrichedRows = rows.map((row: any) => ({
      ...row.toJSON(),
      AddedDate: row.AddedDate
        ? row.AddedDate.toLocaleString('sv-SE', {
            timeZone: 'Asia/Kolkata',
          })
        : null,
    }));

    return {
      total: count,
      page: +page,
      pageSize: +limit,
      data: enrichedRows,

      summary: {
        totalBillAmount,
        totalPaidAmount,
        totalDueAmount,
        totalCashAmount,
        totalUpiAmount,
        pharmaResult,
        specResult,
        grandTotal,
        grandPaid,
        grandDue,
        grandCash,
        grandUpi,
      },
    };
  }

  async exportOpdBilling(user: any, filters: any, res: Response) {
    const { exportType = 'excel', reportType = 'list' } = filters;

    const result = await this.viewOpdBilling(user, {
      ...filters,
      page: 1,
      limit: 100000,
    });

    const rows = result.data;

    const summary: any = result.summary || {};

    const pharmacy: any = summary.pharmaResult || {};

    const spectacle: any = summary.specResult || {};

    if (!rows || rows.length === 0) {
      res.status(404).json({
        message: 'No data found to export.',
      });
      return;
    }

    if (exportType === 'csv') {
      const json2csv = new Parser();

      const csv = json2csv.parse(rows);

      res.setHeader('Content-Type', 'text/csv');

      res.setHeader(
        'Content-Disposition',
        `attachment; filename=OpdBillingDetail-${Date.now()}.csv`,
      );

      res.send(csv);

      return;
    }

    const workbook = new ExcelJS.Workbook();

    const worksheet = workbook.addWorksheet('OPD Billing');

    worksheet.columns = [
      {
        header: 'Bill No',
        key: 'bill_no',
        width: 10,
      },

      {
        header: 'Patient Name',
        key: 'patient_name',
        width: 25,
      },

      {
        header: 'Age',
        key: 'age',
        width: 8,
      },

      {
        header: 'Gender',
        key: 'gender',
        width: 10,
      },

      {
        header: 'Address',
        key: 'localAddress',
        width: 25,
      },

      {
        header: 'Mobile',
        key: 'contactNumber',
        width: 18,
      },

      {
        header: 'LMC ID',
        key: 'uhid',
        width: 18,
      },

      {
        header: 'Total Service Amount',
        key: 'TotalServiceAmount',
        width: 20,
      },

      {
        header: 'Total Discount',
        key: 'TotalDiscount',
        width: 18,
      },

      {
        header: 'Paid Amount',
        key: 'PaidAmount',
        width: 15,
      },

      {
        header: 'Due Amount',
        key: 'DueAmount',
        width: 15,
      },

      {
        header: 'Status',
        key: 'bill_status',
        width: 15,
      },

      {
        header: 'Service Type',
        key: 'ServiceType',
        width: 18,
      },

      {
        header: 'Added By',
        key: 'added_by',
        width: 18,
      },

      {
        header: 'Doctor',
        key: 'doctor_name',
        width: 25,
      },

      {
        header: 'Center',
        key: 'center_name',
        width: 20,
      },

      {
        header: 'Payment Mode',
        key: 'payment_mode',
        width: 15,
      },

      {
        header: 'Patient Type',
        key: 'patient_type',
        width: 15,
      },

      {
        header: 'Department',
        key: 'department_name',
        width: 18,
      },

      {
        header: 'Added Date',
        key: 'AddedDate',
        width: 20,
      },

      {
        header: 'Unique Id',
        key: 'unique_number',
        width: 20,
      },
    ];

    worksheet.addRows(rows);

    const headerRow = worksheet.getRow(1);

    headerRow.eachCell((cell) => {
      cell.font = {
        bold: true,
        size: 12,
        color: {
          argb: 'FFFFFFFF',
        },
      };

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };

      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: '4472C4',
        },
      };

      cell.border = {
        top: {
          style: 'thin',
        },

        left: {
          style: 'thin',
        },

        bottom: {
          style: 'thin',
        },

        right: {
          style: 'thin',
        },
      };
    });

    worksheet.getRow(1).height = 28;

    worksheet.eachRow(
      {
        includeEmpty: false,
      },
      (row, rowNumber) => {
        if (rowNumber === 1) {
          return;
        }

        row.eachCell((cell) => {
          cell.alignment = {
            vertical: 'middle',
            horizontal: 'center',
            wrapText: true,
          };

          cell.border = {
            top: {
              style: 'thin',
              color: {
                argb: 'D9D9D9',
              },
            },

            left: {
              style: 'thin',
              color: {
                argb: 'D9D9D9',
              },
            },

            bottom: {
              style: 'thin',
              color: {
                argb: 'D9D9D9',
              },
            },

            right: {
              style: 'thin',
              color: {
                argb: 'D9D9D9',
              },
            },
          };
        });

        // Alternate row color

        if (rowNumber % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: {
                argb: 'F2F2F2',
              },
            };
          });
        }
      },
    );

    const dateColIndex =
      worksheet.columns.findIndex((column) => column.key === 'AddedDate') + 1;

    if (dateColIndex > 0) {
      worksheet.getColumn(dateColIndex).numFmt = 'yyyy-mm-dd hh:mm:ss';
    }

    if (reportType === 'revenue') {
      const money = (value: any) => {
        return `Rs.${Number(value || 0).toFixed(2)}`;
      };

      const colors = {
        mainHeader: '1F4E78',

        sectionHeader: '5B9BD5',

        tableHeader: 'DDEBF7',

        grandHeader: 'E2F0D9',

        grandValue: 'C6E0B4',

        border: 'B4C7E7',

        text: '1F2937',

        white: 'FFFFFFFF',

        filter: '666666',
      };

      const summaryStartRow = worksheet.lastRow!.number + 4;

      worksheet.mergeCells(`B${summaryStartRow}:F${summaryStartRow}`);

      const summaryHeader = worksheet.getCell(`B${summaryStartRow}`);

      summaryHeader.value = 'BILLING SUMMARY';

      summaryHeader.font = {
        bold: true,

        size: 18,

        color: {
          argb: colors.white,
        },
      };

      summaryHeader.alignment = {
        horizontal: 'center',

        vertical: 'middle',
      };

      summaryHeader.fill = {
        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: colors.mainHeader,
        },
      };

      summaryHeader.border = {
        top: {
          style: 'medium',
          color: {
            argb: colors.mainHeader,
          },
        },

        bottom: {
          style: 'medium',
          color: {
            argb: colors.mainHeader,
          },
        },

        left: {
          style: 'medium',
          color: {
            argb: colors.mainHeader,
          },
        },

        right: {
          style: 'medium',
          color: {
            argb: colors.mainHeader,
          },
        },
      };

      worksheet.getRow(summaryStartRow).height = 34;

      const filterLabels: Record<string, string> = {
        name: 'Patient Name',

        contactNumber: 'Mobile',

        gender: 'Gender',

        category: 'Fin Category',

        startDate: 'Date From',

        endDate: 'Date To',

        external_id: 'UHID',

        idProof_number: 'Unique Id',

        department: 'Department',

        bill_no: 'Bill No',

        doctor: 'Doctor',

        payment_mode: 'Payment Mode',

        added_by: 'Collected By',
      };

      const appliedFilters = Object.entries(filters)

        .filter(([key, value]) => {
          return (
            key !== 'exportType' &&
            key !== 'reportType' &&
            key !== 'page' &&
            key !== 'limit' &&
            value !== undefined &&
            value !== null &&
            value !== ''
          );
        })

        .map(([key, value]) => ({
          name: filterLabels[key] || key,

          value: String(value),
        }));

      const filterRow = summaryStartRow + 2;

      worksheet.mergeCells(`B${filterRow}:F${filterRow}`);

      const filterCell = worksheet.getCell(`B${filterRow}`);

      if (appliedFilters.length > 0) {
        filterCell.value = `Filters Applied: ${appliedFilters
          .map((filter) => `${filter.name} = ${filter.value}`)
          .join(' | ')}`;
      } else {
        filterCell.value = 'Filters Applied: All';
      }

      filterCell.font = {
        size: 10,

        italic: true,

        color: {
          argb: colors.filter,
        },
      };

      filterCell.alignment = {
        horizontal: 'left',

        vertical: 'middle',

        wrapText: true,
      };

      const breakdownHeaderRow = filterRow + 2;

      worksheet.mergeCells(`B${breakdownHeaderRow}:F${breakdownHeaderRow}`);

      const breakdownHeader = worksheet.getCell(`B${breakdownHeaderRow}`);

      breakdownHeader.value = 'BILLING BREAKDOWN';

      breakdownHeader.font = {
        bold: true,

        size: 13,

        color: {
          argb: colors.white,
        },
      };

      breakdownHeader.alignment = {
        horizontal: 'left',

        vertical: 'middle',
      };

      breakdownHeader.fill = {
        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: colors.sectionHeader,
        },
      };

      const tableHeaderRow = breakdownHeaderRow + 1;

      const tableHeaders = [
        'Category',

        'Total Bill',

        'Paid Amount',

        'Due Amount',

        'Cash / Online',
      ];

      tableHeaders.forEach((header, index) => {
        const cell = worksheet.getCell(tableHeaderRow, index + 2);

        cell.value = header;

        cell.font = {
          bold: true,

          size: 11,

          color: {
            argb: colors.text,
          },
        };

        cell.alignment = {
          horizontal: 'center',

          vertical: 'middle',

          wrapText: true,
        };

        cell.fill = {
          type: 'pattern',

          pattern: 'solid',

          fgColor: {
            argb: colors.tableHeader,
          },
        };

        cell.border = {
          top: {
            style: 'thin',
            color: {
              argb: colors.border,
            },
          },

          bottom: {
            style: 'thin',
            color: {
              argb: colors.border,
            },
          },

          left: {
            style: 'thin',
            color: {
              argb: colors.border,
            },
          },

          right: {
            style: 'thin',
            color: {
              argb: colors.border,
            },
          },
        };
      });

      worksheet.getRow(tableHeaderRow).height = 30;

      const billingRows = [
        {
          category: 'OPD',

          total: summary.totalBillAmount,

          paid: summary.totalPaidAmount,

          due: summary.totalDueAmount,

          online: summary.totalUpiAmount,
        },

        {
          category: 'Pharmacy',

          total: pharmacy?.pharmacyRevenue,

          paid: pharmacy?.pharmacyPaid,

          due: pharmacy?.pharmacyDue,

          online: pharmacy?.pharmacyUpi,
        },

        {
          category: 'Spectacle',

          total: spectacle?.spectacleRevenue,

          paid: spectacle?.spectaclePaid,

          due: spectacle?.spectacleDue,

          online: spectacle?.spectacleUpi,
        },
      ];

      const firstBillingRow = tableHeaderRow + 1;

      billingRows.forEach((item, index) => {
        const rowNumber = firstBillingRow + index;

        const values = [
          item.category,

          money(item.total),

          money(item.paid),

          money(item.due),

          money(item.online),
        ];

        values.forEach((value, columnIndex) => {
          const cell = worksheet.getCell(rowNumber, columnIndex + 2);

          cell.value = value;

          cell.font = {
            bold: columnIndex === 0,

            size: 11,

            color: {
              argb: colors.text,
            },
          };

          cell.alignment = {
            horizontal: columnIndex === 0 ? 'left' : 'right',

            vertical: 'middle',

            wrapText: true,
          };

          cell.border = {
            top: {
              style: 'thin',
              color: {
                argb: colors.border,
              },
            },

            bottom: {
              style: 'thin',
              color: {
                argb: colors.border,
              },
            },

            left: {
              style: 'thin',
              color: {
                argb: colors.border,
              },
            },

            right: {
              style: 'thin',
              color: {
                argb: colors.border,
              },
            },
          };

          if (index % 2 === 1) {
            cell.fill = {
              type: 'pattern',

              pattern: 'solid',

              fgColor: {
                argb: 'F7FBFF',
              },
            };
          }
        });

        worksheet.getRow(rowNumber).height = 27;
      });

      // =======================================================
      // 13. GRAND TOTAL HEADER
      // =======================================================

      const grandHeaderRow = firstBillingRow + billingRows.length + 2;

      worksheet.mergeCells(`B${grandHeaderRow}:F${grandHeaderRow}`);

      const grandHeader = worksheet.getCell(`B${grandHeaderRow}`);

      grandHeader.value = 'GRAND TOTAL';

      grandHeader.font = {
        bold: true,

        size: 13,

        color: {
          argb: '1F4E78',
        },
      };

      grandHeader.alignment = {
        horizontal: 'left',

        vertical: 'middle',
      };

      grandHeader.fill = {
        type: 'pattern',

        pattern: 'solid',

        fgColor: {
          argb: colors.grandHeader,
        },
      };

      grandHeader.border = {
        top: {
          style: 'medium',
          color: {
            argb: 'A9D18E',
          },
        },

        bottom: {
          style: 'medium',
          color: {
            argb: 'A9D18E',
          },
        },

        left: {
          style: 'thin',
          color: {
            argb: 'A9D18E',
          },
        },

        right: {
          style: 'thin',
          color: {
            argb: 'A9D18E',
          },
        },
      };

      const grandTotalRow = grandHeaderRow + 1;

      const grandValues = [
        ['Total Bill', summary.grandTotal],

        ['Total Paid', summary.grandPaid],

        ['Total Due', summary.grandDue],

        ['Total Cash', summary.grandCash],

        ['Total Online', summary.grandUpi],
      ];

      grandValues.forEach(([label, value], index) => {
        const cell = worksheet.getCell(grandTotalRow, index + 2);

        cell.value = `${label}\n${money(value)}`;

        cell.font = {
          bold: true,

          size: 11,

          color: {
            argb: colors.text,
          },
        };

        cell.alignment = {
          horizontal: 'center',

          vertical: 'middle',

          wrapText: true,
        };

        cell.fill = {
          type: 'pattern',

          pattern: 'solid',

          fgColor: {
            argb: index === 0 ? colors.grandValue : 'E2F0D9',
          },
        };

        cell.border = {
          top: {
            style: 'medium',
            color: {
              argb: 'A9D18E',
            },
          },

          bottom: {
            style: 'medium',
            color: {
              argb: 'A9D18E',
            },
          },

          left: {
            style: 'thin',
            color: {
              argb: 'A9D18E',
            },
          },

          right: {
            style: 'thin',
            color: {
              argb: 'A9D18E',
            },
          },
        };
      });

      worksheet.getRow(grandTotalRow).height = 45;

      // =======================================================
      // 15. SUMMARY COLUMN WIDTH
      // =======================================================

      worksheet.getColumn(2).width = 22;

      worksheet.getColumn(3).width = 22;

      worksheet.getColumn(4).width = 22;

      worksheet.getColumn(5).width = 22;

      worksheet.getColumn(6).width = 24;

      // =======================================================
      // 16. PRINT / PAGE SETUP
      // =======================================================

      worksheet.pageSetup = {
        orientation: 'landscape',

        fitToPage: true,

        fitToWidth: 1,

        fitToHeight: 0,

        margins: {
          left: 0.25,

          right: 0.25,

          top: 0.5,

          bottom: 0.5,

          header: 0.2,

          footer: 0.2,
        },
      };
    }

    worksheet.views = [
      {
        state: 'frozen',

        ySplit: 1,
      },
    ];

    res.setHeader(
      'Content-Type',

      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    const fileName =
      reportType === 'revenue'
        ? `OpdBillingRevenue-${Date.now()}.xlsx`
        : `OpdBillingDetail-${Date.now()}.xlsx`;

    res.setHeader(
      'Content-Disposition',

      `attachment; filename=${fileName}`,
    );

    await workbook.xlsx.write(res);

    res.end();
  }
  async getCollectedBy(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.billingModel,
    );

    const conditions: string[] = [`u.status = true`];
    const replacements: any = {};

    if (scopeWhere.tenant_id) {
      conditions.push(`d."tenant_id" = :tenant_id`);
      replacements.tenant_id = scopeWhere.tenant_id;
    }

    if (scopeWhere.center_id) {
      conditions.push(`d."center_id" = :center_id`);
      replacements.center_id = scopeWhere.center_id;
    }

    const [results] = await this.sequelize.query(
      `
   SELECT DISTINCT u.id, u.name
    FROM "Users" u
    INNER JOIN "opd_billing" d ON d."AddedBy" = u.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY u.name ASC
    `,
      { replacements },
    );

    return {
      status: true,
      message: 'Collected by list fetch successfully',
      data: results,
    };
  }

  async getPharmacyRevenue(requestingUser: any, from, to) {
    const pharmacyScope = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.pharmacyRevenueModel,
    );

    const pharmacyWhere = {
      ...pharmacyScope,
      IsActive: true,
    };

    if (from && to) {
      const end = new Date(to);
      end.setDate(end.getDate() + 1);

      pharmacyWhere.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (from && !to) {
      const end = new Date(from);
      end.setDate(end.getDate() + 1);

      pharmacyWhere.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (!from && to) {
      const start = new Date(to);
      const end = new Date(to);

      end.setDate(end.getDate() + 1);

      pharmacyWhere.AddedDate = {
        [Op.gte]: start,
        [Op.lt]: end,
      };
    } else {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      pharmacyWhere.AddedDate = {
        [Op.between]: [start, end],
      };
    }
    const pharmacyRows = await this.pharmacyRevenueModel.findAll({
      where: pharmacyWhere,
    });
    const pharmacyCash = pharmacyRows
      .filter((x: any) => x.PaymentmodeID == 1)
      .reduce(
        (sum: number, row: any) => sum + Number(row.RevenueAmount || 0),
        0,
      );

    const pharmacyUpi = pharmacyRows
      .filter((x: any) => [2, 3, 4, 5].includes(Number(x.PaymentmodeID)))
      .reduce(
        (sum: number, row: any) => sum + Number(row.RevenueAmount || 0),
        0,
      );

    const pharmacyDue = pharmacyRows.reduce(
      (sum: number, row: any) => sum + Number(row.DueAmount || 0),
      0,
    );
    const pharmacyRevenue = pharmacyDue + pharmacyCash + pharmacyUpi;

    const pharmacyPaid = pharmacyRevenue - pharmacyDue;

    return {
      pharmacyRevenue,
      pharmacyPaid,
      pharmacyDue,
      pharmacyCash,
      pharmacyUpi,
    };
  }
  async getSpectRevenue(requestingUser: any, from, to) {
    const spectacleScope = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.spectacleRevenueModel,
    );

    const spectacleWhere = {
      ...spectacleScope,
      IsActive: true,
    };
    if (from && to) {
      const end = new Date(to);
      end.setDate(end.getDate() + 1);

      spectacleWhere.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (from && !to) {
      const end = new Date(from);
      end.setDate(end.getDate() + 1);

      spectacleWhere.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (!from && to) {
      const start = new Date(to);
      const end = new Date(to);

      end.setDate(end.getDate() + 1);

      spectacleWhere.AddedDate = {
        [Op.gte]: start,
        [Op.lt]: end,
      };
    } else {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      spectacleWhere.AddedDate = {
        [Op.between]: [start, end],
      };
    }
    const spectacleRows = await this.spectacleRevenueModel.findAll({
      where: spectacleWhere,
    });

    const spectacleDue = spectacleRows.reduce(
      (sum: number, row: any) => sum + Number(row.DueAmount || 0),
      0,
    );

    const spectacleCash = spectacleRows
      .filter((x: any) => Number(x.PaymentmodeID) === 1)
      .reduce(
        (sum: number, row: any) => sum + Number(row.RevenueAmount || 0),
        0,
      );

    const spectacleUpi = spectacleRows
      .filter((x: any) => [2, 3, 4, 5].includes(Number(x.PaymentmodeID)))
      .reduce(
        (sum: number, row: any) => sum + Number(row.RevenueAmount || 0),
        0,
      );
    const spectacleRevenue = spectacleDue + spectacleCash + spectacleUpi;

    const spectaclePaid = spectacleRevenue - spectacleDue;

    return {
      spectacleRevenue,
      spectaclePaid,
      spectacleDue,
      spectacleCash,
      spectacleUpi,
    };
  }

  async viewPatientDetails(requestingUser: any, filters: any) {
    const {
      page = 1,
      limit = 20,
      doctor: doctor_name,
      name: patient_name,
      center_name,
      bill_status,
      startDate: fromDate,
      endDate: toDate,
      contactNumber: mobile,
      external_id: uhid,
      department: department_name,
      payment_mode,
      added_by,
      gender,
      category: patient_type,
      idProof_number: unique_number,
      bill_no,
    } = filters;

    const offset = (page - 1) * limit;

    const where: any = {};

    if (requestingUser.tenantId) {
      where.tenant_id = requestingUser.tenantId;
    }

    if (requestingUser.centerId) {
      where.center_id = requestingUser.centerId;
    }

    const hasUserFilters = Object.values({
      doctor_name,
      patient_name,
      center_name,
      bill_status,
      fromDate,
      toDate,
      mobile,
      uhid,
      department_name,
      payment_mode,
      added_by,
      gender,
      patient_type,
      unique_number,
      bill_no,
    }).some((v) => v !== undefined && v !== null && v !== '');

    if (!hasUserFilters) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);

      where.AddedDate = {
        [Op.between]: [start, end],
      };
    }

    if (doctor_name) {
      where.doctor_name = {
        [Op.iLike]: `%${doctor_name}%`,
      };
    }

    if (patient_name) {
      where.patient_name = {
        [Op.iLike]: `%${patient_name}%`,
      };
    }

    if (center_name) {
      where.center_name = {
        [Op.iLike]: `%${center_name}%`,
      };
    }

    if (mobile) {
      where.contactNumber = {
        [Op.iLike]: `%${mobile}%`,
      };
    }

    if (uhid) {
      where.uhid = {
        [Op.iLike]: `%${uhid}%`,
      };
    }

    if (department_name) {
      where.department_name = {
        [Op.iLike]: `%${department_name}%`,
      };
    }

    if (patient_type) {
      where.patient_type = {
        [Op.iLike]: `%${patient_type}%`,
      };
    }

    if (payment_mode) {
      where.payment_mode = {
        [Op.iLike]: `%${payment_mode}%`,
      };
    }

    if (gender) {
      where.gender = gender;
    }

    if (added_by) {
      where.added_by = {
        [Op.iLike]: `%${added_by}%`,
      };
    }

    if (unique_number) {
      where.unique_number = {
        [Op.iLike]: `%${unique_number}%`,
      };
    }

    if (bill_status !== undefined && bill_status !== '') {
      where.bill_status = bill_status;
    }

    if (bill_no) {
      where.bill_no = Number(bill_no);
    }

    const parseDate = (val: string): Date | null => {
      if (!val) return null;

      const [year, month, day] = val.split('-').map(Number);

      const parsed = new Date(year, month - 1, day, 0, 0, 0, 0);

      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const from = parseDate(fromDate);
    const to = parseDate(toDate);

    if (from && to) {
      const end = new Date(to);
      end.setDate(end.getDate() + 1);

      where.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (from && !to) {
      const end = new Date(from);
      end.setDate(end.getDate() + 1);

      where.AddedDate = {
        [Op.gte]: from,
        [Op.lt]: end,
      };
    } else if (!from && to) {
      const start = new Date(to);

      const end = new Date(to);
      end.setDate(end.getDate() + 1);

      where.AddedDate = {
        [Op.gte]: start,
        [Op.lt]: end,
      };
    }

    const { rows, count } = await this.viewModel.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['bill_no', 'DESC']],
    });

    const allRows = await this.viewModel.findAll({
      where,
    });

    const totalBillAmount = allRows.reduce(
      (sum, row: any) => sum + Number(row.TotalServiceAmount || 0),
      0,
    );

    const totalPaidAmount = allRows.reduce(
      (sum, row: any) => sum + Number(row.PaidAmount || 0),
      0,
    );

    const totalDueAmount = allRows.reduce(
      (sum, row: any) => sum + Number(row.DueAmount || 0),
      0,
    );

    let totalCashAmount = 0;
    let totalUpiAmount = 0;

    allRows.forEach((row: any) => {
      switch (row.payment_mode) {
        case 'Cash Payment':
          totalCashAmount += Number(row.PaidAmount || 0);
          break;

        case 'Cash/Online Payment':
          totalCashAmount += Number(row.CashAmount || 0);
          totalUpiAmount += Number(row.CardAmount || 0);
          break;

        case 'UPI':
        case 'Card Payment':
        case 'Cost Free':
          totalUpiAmount += Number(row.PaidAmount || 0);
          break;
      }
    });

    const pharmaResult = await this.getPharmacyRevenue(
      requestingUser,
      from,
      to,
    );

    const specResult = await this.getSpectRevenue(requestingUser, from, to);

    const grandTotal =
      totalBillAmount +
      Number(pharmaResult?.pharmacyRevenue || 0) +
      Number(specResult?.spectacleRevenue || 0);

    const grandPaid =
      totalPaidAmount +
      Number(pharmaResult?.pharmacyPaid || 0) +
      Number(specResult?.spectaclePaid || 0);

    const grandDue =
      totalDueAmount +
      Number(pharmaResult?.pharmacyDue || 0) +
      Number(specResult?.spectacleDue || 0);

    const grandCash =
      totalCashAmount +
      Number(pharmaResult?.pharmacyCash || 0) +
      Number(specResult?.spectacleCash || 0);

    const grandUpi =
      totalUpiAmount +
      Number(pharmaResult?.pharmacyUpi || 0) +
      Number(specResult?.spectacleUpi || 0);

    const enrichedRows = rows.map((row: any) => ({
      ...row.toJSON(),

      AddedDate: row.AddedDate
        ? row.AddedDate.toLocaleString('sv-SE', {
            timeZone: 'Asia/Kolkata',
          })
        : null,
    }));
    const saleMedicineStockBillsResult = await this.viewSaleMedicineStockBills(
      requestingUser,
      filters,
    );
    const pharmacyMap = new Map();

    for (const pharma of saleMedicineStockBillsResult?.data || []) {
      const picasoId = pharma?.PicasoID;

      if (!picasoId) continue;

      if (!pharmacyMap.has(picasoId)) {
        pharmacyMap.set(picasoId, {
          PharmaTotalAmount: 0,
          PharmaBillNo: [],
          PharmaItemName: [],
        });
      }

      const existing = pharmacyMap.get(picasoId);

      const amount = Number(
        String(pharma?.TotalAmount || '')
          .replace(/[$,]/g, '')
          .trim(),
      );
      if (Number.isFinite(amount)) {
        existing.PharmaTotalAmount += amount;
      }

      // Pharmacy bill number
      if (pharma?.BillNo) {
        const billNo = String(pharma.BillNo);

        if (!existing.PharmaBillNo.includes(billNo)) {
          existing.PharmaBillNo.push(billNo);
        }
      }

      // Pharmacy item names
      if (Array.isArray(pharma?.footerItems)) {
        for (const item of pharma.footerItems) {
          const itemName = item?.ItemName;

          if (itemName && !existing.PharmaItemName.includes(itemName)) {
            existing.PharmaItemName.push(itemName);
          }
        }
      }
    }
    const mergedData = Object.values(
      enrichedRows.reduce((acc: any, row: any) => {
        // const patientId = row.patient_id;

        //New logic based on patient_id +Added Date,
        const visitDate = row.AddedDate
          ? new Date(row.AddedDate).toISOString().split('T')[0]
          : '';

        const mergeKey = `${row.patient_id}_${visitDate}`;
        const paidAmount =
          Number(
            String(row?.PaidAmount || '')
              .replace(/[$,]/g, '')
              .trim(),
          ) || 0;

        const dueAmount =
          Number(
            String(row?.DueAmount || '')
              .replace(/[$,]/g, '')
              .trim(),
          ) || 0;

        if (!acc[mergeKey]) {
          acc[mergeKey] = {
            ...row,

            bill_no: row.bill_no ? [row.bill_no] : [],
            complaint: row.complaint ? [row.complaint] : [],
            ServiceType: row.ServiceType ? [row.ServiceType] : [],
            payment_mode: row.payment_mode ? [row.payment_mode] : [],
            department_name: row.department_name ? [row.department_name] : [],
            doctor_name: row.doctor_name ? [row.doctor_name] : [],

            opd_billing_data: Array.isArray(row.opd_billing_data)
              ? [...row.opd_billing_data]
              : [],
            NetPaidAmount: paidAmount,
            NetDueAmount: dueAmount,
          };

          return acc;
        }

        const existing = acc[mergeKey];

        const addUnique = (field: string, value: any) => {
          if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            !existing[field].includes(value)
          ) {
            existing[field] = [...existing[field], value];
          }
        };

        addUnique('bill_no', row.bill_no);
        addUnique('complaint', row.complaint);
        addUnique('ServiceType', row.ServiceType);
        addUnique('payment_mode', row.payment_mode);
        addUnique('department_name', row.department_name);
        addUnique('doctor_name', row.doctor_name);

        if (Array.isArray(row.opd_billing_data)) {
          existing.opd_billing_data = [
            ...existing.opd_billing_data,
            ...row.opd_billing_data,
          ];
        }
        existing.NetPaidAmount += paidAmount;
        existing.NetDueAmount += dueAmount;

        return acc;
      }, {}),
    ).map((row: any) => {
      const serviceNames = [
        ...new Set(
          row.opd_billing_data
            .map((service: any) => service?.ServiceName)
            .filter(Boolean),
        ),
      ];

      const netServiceAmount = row.opd_billing_data.reduce(
        (sum: number, service: any) => {
          const amount = Number(
            String(service?.NetServiceAmount || '')
              .replace(/[$,]/g, '')
              .trim(),
          );

          return sum + (Number.isFinite(amount) ? amount : 0);
        },
        0,
      );

      // Get pharmacy data using UHID = PicasoID
      const pharmacy = pharmacyMap.get(row.uhid);
      const pharmacySummary = {
        cashTotal: saleMedicineStockBillsResult?.cashTotal,
        costFreeTotal: saleMedicineStockBillsResult?.costFreeTotal,

        onlineTotal: saleMedicineStockBillsResult?.onlineTotal,

        totalDiscount: saleMedicineStockBillsResult?.totalDiscount,
        totalDue: saleMedicineStockBillsResult?.totalDue,
        totalIssueQty: saleMedicineStockBillsResult?.totalIssueQty,
        totalPaid: saleMedicineStockBillsResult?.totalPaid,
        totalSales: saleMedicineStockBillsResult?.totalSales,
      };
      return {
        ...row,

        bill_no: row.bill_no.join(', '),
        complaint: row.complaint.join(', '),
        ServiceType: row.ServiceType.join(', '),
        payment_mode: row.payment_mode.join(', '),
        department_name: row.department_name.join(', '),
        doctor_name: row.doctor_name.join(', '),

        ServiceName: serviceNames.join(', '),

        NetServiceAmount: netServiceAmount,
        NetPaidAmount: row.NetPaidAmount,
        NetDueAmount: row.NetDueAmount,

        // Pharmacy data
        PharmaTotalAmount: pharmacy?.PharmaTotalAmount || 0,
        PharmaBillNo: pharmacy?.PharmaBillNo?.join(', ') || '',
        PharmaItemName: pharmacy?.PharmaItemName?.join(', ') || '',
        pharmaSummary: pharmacySummary,
      };
    });
    return {
      total: count,
      page: Number(page),
      pageSize: Number(limit),

      data: enrichedRows,
      mergedData,
      summary: {
        totalBillAmount,
        totalPaidAmount,
        totalDueAmount,

        totalCashAmount,
        totalUpiAmount,

        pharmaResult,
        specResult,

        grandTotal,
        grandPaid,
        grandDue,
        grandCash,
        grandUpi,
      },
    };
  }
  async viewSaleMedicineStockBills(requestingUser: any, filters: any) {
    const {
      startDate,
      endDate,
      AddedBy,
      descriptions,
      name,
      BillNo,
      external_id,
      contactNumber,
      category,
    } = filters;

    const pageNumber = Math.max(Number(filters.page) || 1, 1);
    const limitNumber = Math.max(Number(filters.limit) || 20, 1);

    const offset = (pageNumber - 1) * limitNumber;

    const where: any = {};

    if (requestingUser.tenantId) {
      where.tenant_id = requestingUser.tenantId;
    }

    if (requestingUser.centerId) {
      where.center_id = requestingUser.centerId;
    }
    const headerWhere: any = {
      ...where,
      IsActive: '1',
    };
    const footerWhere: any = {};

    /* -----------------------------
       Header Filters
    ------------------------------*/

    if (name) {
      headerWhere.CustommerName = name;
    }

    if (AddedBy) {
      headerWhere.AddedBy = Number(AddedBy);
    }

    if (BillNo) {
      headerWhere.BillNo = BillNo;
    }

    if (external_id) {
      headerWhere.PicasoID = external_id;
    }

    if (contactNumber) {
      headerWhere.Mobileno = contactNumber;
    }

    if (category) {
      headerWhere.PatientType = category;
    }
    /* -----------------------------
       Footer Filter (ItemName)
    ------------------------------*/

    if (descriptions) {
      footerWhere.ItemName = { [Op.iLike]: `%${descriptions}%` };
    }

    /* -----------------------------
       Date Filtering (Header)
    ------------------------------*/

    const parseDate = (val: string): Date | null => {
      if (!val) return null;
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const from = parseDate(startDate);
    const to = parseDate(endDate);

    if (from && to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      headerWhere.AddedDate = { [Op.between]: [from, end] };
    } else if (from && !to) {
      const start = new Date(from);
      const end = new Date(from);
      end.setHours(23, 59, 59, 999);
      headerWhere.AddedDate = { [Op.between]: [start, end] };
    } else if (!from && to) {
      const start = new Date(to);
      start.setHours(0, 0, 0, 0);
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      headerWhere.AddedDate = { [Op.between]: [start, end] };
    }

    /* -----------------------------
       Default Today Filter
    ------------------------------*/

    const hasUserFilters = Object.keys({
      startDate,
      endDate,
      AddedBy,
      descriptions,
      CustommerName: name,
      BillNo,
      external_id,
      contactNumber,
      category,
    }).some((key) => filters[key]);

    if (!hasUserFilters) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      headerWhere.AddedDate = { [Op.between]: [start, end] };
    }

    const { rows, count } =
      await this.picasoOpdPhrgBillHeaderModel.findAndCountAll({
        where: headerWhere,
        limit: limitNumber,
        offset,
        distinct: true,
        order: [['ID', 'DESC']],
        include: [
          {
            model: PicasoOpdPhrfBillFooterModel,
            as: 'footerItems',
            required: Object.keys(footerWhere).length > 0,
            where:
              Object.keys(footerWhere).length > 0 ? footerWhere : undefined,
          },
        ],
      });

    const footerTotals = (await this.picasoOpdPhrfBillFooterModel.findOne({
      raw: true,
      attributes: [
        [
          Sequelize.literal('COALESCE(SUM("NetAmount"::numeric), 0::numeric)'),
          'totalSales',
        ],
        [
          Sequelize.fn(
            'COALESCE',
            Sequelize.fn('SUM', Sequelize.col('IssueQty')),
            0,
          ),
          'IssueQty',
        ],
      ],
      include: [
        {
          model: PicasoOpdPhrgBillHeaderModel,
          as: 'header',
          required: true,
          attributes: [],
          where: headerWhere,
        },
      ],
      where: Object.keys(footerWhere).length ? footerWhere : undefined,
    })) as any;

    const dueTotals = (await this.picasoOpdPhrgBillHeaderModel.findOne({
      raw: true,
      attributes: [
        [
          Sequelize.literal(`
          COALESCE(
            SUM(
              CASE
                WHEN "PayMode" = 5 THEN 0::numeric
                ELSE COALESCE("BalanceAmount"::numeric, 0::numeric)
              END
            ),
            0::numeric
          )
        `),
          'totalDue',
        ],
      ],
      where: headerWhere,
    })) as any;

    const headerTotals = (await this.picasoOpdPhrgBillHeaderModel.findOne({
      raw: true,
      attributes: [
        [
          Sequelize.literal(
            'COALESCE(SUM("DiscountAmount"::numeric), 0::numeric)',
          ),
          'totalDiscount',
        ],
        [
          Sequelize.literal('COALESCE(SUM("PaidAmount"::numeric), 0::numeric)'),
          'totalPaid',
        ],

        // PayMode 5 = Cost Free
        [
          Sequelize.literal(`
          COALESCE(
            SUM(
              CASE
                WHEN "PayMode" = 5
                THEN COALESCE("GrossAmount"::numeric, 0)
                ELSE 0
              END
            ),
            0
          )
        `),
          'costFree',
        ],

        // PayMode 1 = Cash
        [
          Sequelize.literal(`
          COALESCE(
            SUM(
              CASE
                WHEN "PayMode" = 1
                THEN COALESCE("GrossAmount"::numeric, 0)
                ELSE 0
              END
            ),
            0
          )
        `),
          'cashPayment',
        ],

        // PayMode 3 + 4 = Card/Online
        [
          Sequelize.literal(`
          COALESCE(
            SUM(
              CASE
                WHEN "PayMode" IN (2,3, 4)
                THEN COALESCE("GrossAmount"::numeric, 0)
                ELSE 0
              END
            ),
            0
          )
        `),
          'cardOnlinePayment',
        ],
      ],
      where: headerWhere,
    })) as any;

    return {
      data: rows,
      totalSales: Number(footerTotals?.totalSales) || 0,
      totalDiscount: Number(headerTotals?.totalDiscount) || 0,
      totalPaid: Number(headerTotals?.totalPaid) || 0,
      totalDue: Number(dueTotals?.totalDue) || 0,
      totalIssueQty: Number(footerTotals?.IssueQty) || 0,
      cashTotal: Number(headerTotals?.cashPayment) || 0,
      onlineTotal: Number(headerTotals?.cardOnlinePayment) || 0,
      costFreeTotal: Number(headerTotals?.costFree) || 0,

      pagination: {
        totalRecords: count,
        currentPage: pageNumber,
        totalPages: Math.ceil(count / limitNumber),
        limit: limitNumber,
      },
    };
  }

  async viewOpdBillingCount(requestingUser: any) {
    const where = {
      tenant_id: requestingUser.tenantId,
      center_id: requestingUser.centerId,
    };

    const allRows = await this.viewModel.findAll({
      where,
      raw: true,
      order: [['bill_no', 'DESC']],
    });

    return {
      total: allRows.length,
      data: allRows,
    };
  }
}
