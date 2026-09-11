import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';

import { buildScopeWhere } from 'src/helper/auth.helper';
import { PicasoPharmacyRevenueModel } from 'src/models/PharmacyRevenue';
import * as ExcelJS from 'exceljs';
import { Parser } from 'json2csv';
import { Response } from 'express';
@Injectable()
export class PharmacyRevenueService {
  constructor(
    @InjectModel(PicasoPharmacyRevenueModel)
    private readonly pharmacyRevenueModel: typeof PicasoPharmacyRevenueModel,
  ) {}

  async create(
    requestingUser: any,
    body: any,
  ) {
    if (!body.RevenueDate) {
      throw new BadRequestException(
        'Revenue Date is required',
      );
    }

    if (!body.PaymentmodeID) {
      throw new BadRequestException(
        'Payment Mode is required',
      );
    }

    if (!body.RevenueAmount) {
      throw new BadRequestException(
        'Revenue Amount is required',
      );
    }

    return this.pharmacyRevenueModel.create({
      RevenueDate: body.RevenueDate,
      PaymentmodeID: body.PaymentmodeID,
      RevenueAmount: body.RevenueAmount,
      DueAmount: body.DueAmount || 0,

      AddedBy: requestingUser.id,
      AddedDate: new Date(),

      tenant_id: requestingUser.tenantId,
      center_id: requestingUser.centerId,

      IsActive: true,
    });
  }

  async view(
    requestingUser: any,
    query: any,
  ) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.pharmacyRevenueModel,
    );

    const where: any = {
      ...scopeWhere,
      IsActive: true,
    };
    const parseDate = (
  val: string,
): Date | null => {
  if (!val) return null;

  const [year, month, day] = val
    .split('-')
    .map(Number);

  const parsed = new Date(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0,
  );

  return isNaN(parsed.getTime())
    ? null
    : parsed;
};
    const from = parseDate(query.startDate);
const to = parseDate(query.endDate);

if (from && to) {
  const end = new Date(to);
  end.setDate(end.getDate() + 1);

  where.RevenueDate = {
    [Op.gte]: from,
    [Op.lt]: end,
  };
}
else if (from && !to) {
  const end = new Date(from);
  end.setDate(end.getDate() + 1);

  where.RevenueDate = {
    [Op.gte]: from,
    [Op.lt]: end,
  };
}
else if (!from && to) {
  const start = new Date(to);
  const end = new Date(to);

  end.setDate(end.getDate() + 1);

  where.RevenueDate = {
    [Op.gte]: start,
    [Op.lt]: end,
  };
}
 
    const limit = query.limit
      ? parseInt(query.limit)
      : 20;

    const offset = query.page
      ? (parseInt(query.page) - 1) * limit
      : 0;

    const { rows, count } =
      await this.pharmacyRevenueModel.findAndCountAll({
        where,
        order: [['RevenueID', 'DESC']],
        limit,
        offset,
      });

    return {
      data: rows,
      total: count,
      page:
        query.page &&
        Number(query.page) > 0
          ? Number(query.page)
          : 1,
      totalPages: Math.ceil(
        count / limit,
      ),
    };
  }

  async getById(
    requestingUser: any,
    id: number,
  ) {
    const data =
      await this.pharmacyRevenueModel.findByPk(
        id,
      );

    if (!data) {
      throw new NotFoundException(
        'Revenue not found',
      );
    }

    return data;
  }

  async update(
    id: number,
    body: any,
  ) {
    const revenue =
      await this.pharmacyRevenueModel.findByPk(
        id,
      );

    if (!revenue) {
      throw new NotFoundException(
        'Revenue not found',
      );
    }

    await revenue.update({
      RevenueDate: body.RevenueDate,
      PaymentmodeID: body.PaymentmodeID,
      RevenueAmount: body.RevenueAmount,
      DueAmount: body.DueAmount,
    });

    return {
      message:
        'Revenue updated successfully',
    };
  }

  async delete(id: number) {
    const revenue =
      await this.pharmacyRevenueModel.findByPk(
        id,
      );

    if (!revenue) {
      throw new NotFoundException(
        'Revenue not found',
      );
    }

    await revenue.update({
      IsActive: false,
    });

    return {
      message:
        'Revenue deleted successfully',
    };
  }
  async exportRevenue(
  user: any,
  filters: any,
  res: Response,
) {
  const scopeWhere = buildScopeWhere(
    {
      id: user.id,
      role: user.role,
      tenant_id: user.tenantId,
      center_id: user.centerId,
    },
    this.pharmacyRevenueModel,
  );

  const where: any = {
    ...scopeWhere,
    IsActive: true,
  };

 
  const from = filters.startDate
    ? new Date(filters.startDate)
    : null;

  const to = filters.endDate
    ? new Date(filters.endDate)
    : null;

  if (from && to) {
    to.setDate(to.getDate() + 1);

    where.RevenueDate = {
      [Op.gte]: from,
      [Op.lt]: to,
    };
  }

  const rows =
    await this.pharmacyRevenueModel.findAll({
      where,
      order: [['RevenueID', 'DESC']],
    });

  if (!rows.length) {
    throw new NotFoundException(
      'No data found to export',
    );
  }

  const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Pharmacy Revenue');

worksheet.columns = [
  { header: 'Revenue ID', key: 'RevenueID', width: 15 },
  { header: 'Revenue Date', key: 'RevenueDate', width: 20 },
  { header: 'Payment Mode', key: 'PaymentmodeID', width: 20 },
  { header: 'Revenue Amount', key: 'RevenueAmount', width: 20 },
  { header: 'Due Amount', key: 'DueAmount', width: 20 },
];
const payModeMap = {
  1: 'Cash Payment',
  2: 'Card Payment',
  3: 'Cash/Online Payment',
  4: 'UPI',
  5: 'Cost Free',
};
worksheet.addRows(rows.map((item) => ({
  RevenueID: item.RevenueID,
  RevenueDate: item.RevenueDate,
  PaymentmodeID:
      payModeMap[item.PaymentmodeID] || '-',
  RevenueAmount: item.RevenueAmount,
  DueAmount: item.DueAmount,
})));
const totalRevenue = rows.reduce(
  (sum, item) =>
    sum + Number(item.RevenueAmount || 0),
  0,
);

const totalDue = rows.reduce(
  (sum, item) =>
    sum + Number(item.DueAmount || 0),
  0,
);

const grandTotal =
  totalRevenue + totalDue;
  worksheet.addRow([]);
worksheet.addRow([
  
  '',
  '',
  'Total Revenue:',
  totalRevenue,
]);

worksheet.addRow([
 
  '',
  '',
  'Total Due:',
  totalDue,
]);

worksheet.addRow([
  
  '',
  '',
  'Grand Total:',
  grandTotal,
]);

res.setHeader(
  'Content-Type',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
);

res.setHeader(
  'Content-Disposition',
  `attachment; filename=PharmacyRevenue-${Date.now()}.xlsx`,
);

await workbook.xlsx.write(res);
res.end();
}
}