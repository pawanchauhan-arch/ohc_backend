import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Sequelize, Op } from 'sequelize';
// import { OPDBilling } from '../../models/OpdBilling';
import { PicasoOpdCampBillHeader } from 'src/models/CampOpdBilling';
import { PicasoOpdCampBillFooter } from 'src/models/CampOpdBillingDetails';
import { ViewCampOpdBillingSummary } from 'src/models/viewCampOpdBilling';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { buildScopeWhere } from 'src/helper/auth.helper';


@Injectable()
export class CampOpdBillingService {
  constructor(
    // private readonly sequelize: Sequelize,
    @InjectConnection()
    private readonly sequelize: Sequelize,

    @InjectModel(PicasoOpdCampBillHeader)
    private readonly billingModel: typeof PicasoOpdCampBillHeader,

    @InjectModel(PicasoOpdCampBillFooter)
    private readonly billDetailModel: typeof PicasoOpdCampBillFooter,

    @InjectModel(ViewCampOpdBillingSummary)
    private readonly viewModel: typeof ViewCampOpdBillingSummary,

    @InjectModel(DRIVERMASTER)
    private readonly driverMasterModel: typeof DRIVERMASTER,
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
      const bill = await this.billingModel.create(data.header, { transaction });
      await bill.update(
        {
          BillHeadID: bill.ID,
          BillNo: bill.ID,
        },
        { transaction },
      );
      if (data.details && data.details.length > 0) {
        for (const detail of data.details) {
          detail.BillHeadID = bill.ID;
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
  where.BillNo = {
    [Op.like]: `%${query.bill_no}%`,
  };
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

  async updateBill(id: number, data: any) {
    const transaction = await this.billingModel.sequelize.transaction();
    try {
      const bill = await this.billingModel.findByPk(id);
      if (!bill) throw new NotFoundException('Bill not found');

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

  async viewOpdBillingcamp(requestingUser: any, filters: any) {
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
   
    return {
      total: count,
      page: +page,
      pageSize: +limit,
      data: rows,
    };
  }

  async exportOpdBilling(user: any, filters: any, res: Response) {
    const { exportType = 'excel' } = filters;

    const result = await this.viewOpdBillingcamp(user, filters);
    const rows = result.data;

    if (rows.length === 0) {
      res.status(404).json({ message: 'No data found to export.' });
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
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('OPD Billing');

      // 🧭 Define Columns
      worksheet.columns = [
        { header: 'Bill No', key: 'bill_no', width: 10 },
        { header: 'Patient Name', key: 'patient_name', width: 25 },
        { header: 'Age', key: 'age', width: 8 },
        { header: 'Gender', key: 'gender', width: 10 },
        { header: 'Address', key: 'localAddress', width: 25 },
        { header: 'Mobile', key: 'contactNumber', width: 18 },
        { header: 'LMC ID', key: 'uhid', width: 18 },
        {
          header: 'Total Service Amount',
          key: 'TotalServiceAmount',
          width: 20,
        },
        { header: 'Total Discount', key: 'TotalDiscount', width: 18 },
        { header: 'Paid Amount', key: 'PaidAmount', width: 15 },
        { header: 'Due Amount', key: 'DueAmount', width: 15 },
        { header: 'Status', key: 'bill_status', width: 15 },
        { header: 'Service Type', key: 'ServiceType', width: 18 },
        { header: 'Added By', key: 'added_by', width: 18 },
        { header: 'Doctor', key: 'doctor_name', width: 25 },
        { header: 'Center', key: 'center_name', width: 20 },
        { header: 'Payment Mode', key: 'payment_mode', width: 15 },
        { header: 'Patient Type', key: 'patient_type', width: 15 },
        { header: 'Department', key: 'department_name', width: 18 },
        { header: 'Added Date', key: 'AddedDate', width: 20 },
        { header: 'Unique Id', key: 'unique_number', width: 20 },
      ];

      worksheet.addRows(rows);
      const headerRow = worksheet.getRow(1);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '4472C4' },
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber !== 1) {
          row.eachCell((cell) => {
            cell.alignment = {
              vertical: 'middle',
              horizontal: 'center',
              wrapText: true,
            };
            cell.border = {
              top: { style: 'thin', color: { argb: 'D9D9D9' } },
              left: { style: 'thin', color: { argb: 'D9D9D9' } },
              bottom: { style: 'thin', color: { argb: 'D9D9D9' } },
              right: { style: 'thin', color: { argb: 'D9D9D9' } },
            };
          });

          if (rowNumber % 2 === 0) {
            row.eachCell((cell) => {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F2F2F2' },
              };
            });
          }
        }
      });
      const dateColIndex =
        worksheet.columns.findIndex((c) => c.key === 'AddedDate') + 1;
      if (dateColIndex > 0) {
        worksheet.getColumn(dateColIndex).numFmt = 'yyyy-mm-dd hh:mm:ss';
      }

      worksheet.views = [{ state: 'frozen', ySplit: 1 }];
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=OpdBillingDetail-${Date.now()}.xlsx`,
      );

      await workbook.xlsx.write(res);
      res.end();
    }
  }
  async getCollectedcampBy(requestingUser: any) {
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
      INNER JOIN "picaso_opd_campbill_header" d ON d."AddedBy" = u.id
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
}
