import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, WhereOptions } from 'sequelize';
import { PicasoItemTypeModel } from '../../models/MedicineItemTypes';
import { PicasoItemDetailModel } from '../../models/MedicineItemDetails';
import { PicasoStrStockdetailsModel } from '../../models/StockDetails';
import { Sequelize } from 'sequelize-typescript';
import { PicasoOpdPhrgBillHeaderModel } from 'src/models/MedicineOpdBillHeader';
import { PicasoOpdPhrfBillFooterModel } from 'src/models/MedicineOpdBillFooter';
import { PicasoOpdPhrfcampBillFooterModel } from 'src/models/MedicineOpdcampBillFooter';
import { PicasoOpdPhrgcampBillHeaderModel } from 'src/models/MedicineOpdcampBillHeader';
import { GlobalHelper } from 'src/helper/global.helper';
import { buildScopeWhere } from 'src/helper/auth.helper';
type TotalsResult = {
  totalSales: string | number | null;
  totalQty: string | number | null;
};
@Injectable()
export class MedicineInvetoryService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(PicasoItemTypeModel)
    private readonly itemTypeModel: typeof PicasoItemTypeModel,

    @InjectModel(PicasoItemDetailModel)
    private readonly itemDetailModel: typeof PicasoItemDetailModel,

    @InjectModel(PicasoStrStockdetailsModel)
    private readonly picasoStrStockdetailsModel: typeof PicasoStrStockdetailsModel,

    @InjectModel(PicasoOpdPhrgBillHeaderModel)
    private readonly picasoOpdPhrgBillHeaderModel: typeof PicasoOpdPhrgBillHeaderModel,

    @InjectModel(PicasoOpdPhrfBillFooterModel)
    private readonly picasoOpdPhrfBillFooterModel: typeof PicasoOpdPhrfBillFooterModel,

    @InjectModel(PicasoOpdPhrgcampBillHeaderModel)
    private readonly picasoOpdPhrgcampBillHeaderModel: typeof PicasoOpdPhrgcampBillHeaderModel,

    @InjectModel(PicasoOpdPhrfcampBillFooterModel)
    private readonly picasoOpdPhrfcampBillFooterModel: typeof PicasoOpdPhrfcampBillFooterModel,
  ) {} /* Get all medicine items with filters & search
   */

  async getAllMedicineItems(
    requestingUser: any,
    params: {
      search?: string;
      itemTypeId?: number;
      subGroupId?: number;
      storeType?: number;
      companyId?: number;
      isActive?: boolean;
      page?: number;
      limit?: number;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
      code?: string;
    },
  ) {
    try {
      const {
        search,
        itemTypeId,
        subGroupId,
        storeType,
        companyId,
        isActive = true,
        page = 1,
        limit = 20,
        sortBy = 'id',
        sortOrder = 'DESC',
        code,
      } = params;

      // const scopeWhere = buildScopeWhere(
      //   {
      //     id: requestingUser.id,
      //     role: requestingUser.role,
      //     tenant_id: requestingUser.tenantId,
      //     center_id: requestingUser.centerId,
      //   },
      //   this.itemDetailModel,
      // );

      const where: any = {
        // ...scopeWhere,
      };
      if (typeof isActive === 'boolean') {
        where.isactive = isActive;
      }

      if (itemTypeId) {
        where.itemtypeid = itemTypeId;
      }

      if (subGroupId) {
        where.subgroupid = subGroupId;
      }

      if (storeType) {
        where.storetype = storeType;
      }

      if (companyId) {
        where.companyid = companyId;
      }
      if (code) {
        where.code = code;
      }

      if (search && search.trim() !== '') {
        where[Op.or] = [
          // { code: { [Op.iLike]: `%${search}%` } },
          { descriptions: { [Op.iLike]: `%${search}%` } },
        ];
      }

      const offset = (page - 1) * limit;

      const { rows, count } = await this.itemDetailModel.findAndCountAll({
        where,
        include: [
          {
            model: this.itemTypeModel,
            required: false, // LEFT JOIN
            attributes: ['ID', 'Code', 'Descriptions'],
          },
        ],
        order: [[sortBy, sortOrder]],
        limit,
        offset,
      });

      return {
        data: rows,
        pagination: {
          totalRecords: count,
          currentPage: page,
          totalPages: Math.ceil(count / limit),
          limit,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch medicine items');
    }
  }
  async createType(requestingUser: any, payload: any) {
    return this.itemTypeModel.create({
      ...payload,
      isactive: true,
      addeddate: new Date(),
      addedby: requestingUser.id,
      tenant_id: requestingUser.tenantId,
      center_id: requestingUser.centerId,
    });
  }

  async updateType(id: number, payload: any) {
    await this.itemTypeModel.update(
      {
        ...payload,
        modifieddate: new Date(),
      },
      { where: { ID: id } },
    );

    return this.itemTypeModel.findByPk(id);
  }
  async findAllType(activeOnly = false) {
    return this.itemTypeModel.findAll({
      where: activeOnly ? { isactive: true } : undefined,
      include: [{ association: 'itemDetails' }],
      order: [['ID', 'DESC']],
    });
  }

  async setActiveType(id: number, isactive: boolean) {
    await this.itemTypeModel.update({ isactive }, { where: { ID: id } });

    return { id, isactive };
  }

  async createItemDetail(requestingUser: any, payload: any) {
    const created = await this.itemDetailModel.create({
      ...payload,
      isactive: true,
      addeddate: new Date(),
      addedby: requestingUser.id,
      tenant_id: requestingUser.tenantId,
      center_id: requestingUser.centerId,
    });
    await created.update({
      itemid: created.id,
    });

    return created;
  }

  async updateItemDetail(id: number, payload: any) {
    await this.itemDetailModel.update(
      {
        ...payload,
        modifieddate: new Date(),
      },
      { where: { id } },
    );

    return this.itemDetailModel.findByPk(id);
  }

  async setActiveItemDetail(id: number, isactive: boolean) {
    await this.itemDetailModel.update({ isactive }, { where: { id } });

    return { id, isactive };
  }

  async findByItemType(
    requestingUser: any,
    itemtypeid: number,
    activeOnly = false,
  ) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.itemDetailModel,
    );

    return this.itemDetailModel.findAll({
      where: {
        itemtypeid,
        ...(activeOnly ? { isactive: true } : {}),
        ...scopeWhere,
      },
      order: [['id', 'DESC']],
    });
  }
  async addStockDetails(requestingUser: any, payload: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const { items, ...common } = payload;

      if (!items || !items.length) {
        throw new Error('No items found');
      }
      const lastStock = await this.picasoStrStockdetailsModel.findOne({
        order: [['ID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const nextStockId = Number(lastStock?.ID || 0) + 1;
      const stockNo = String(nextStockId);

      for (const item of items) {
        const noQtyPerStrip = Number(item.NoQtyperStrip || 1);
        const noStrip = Number(item.NoStrip || 1);

        const cp = Number(item.CP || 0);
        const mrp = Number(item.MRP || 0);
        const recvQty = Number(item.RecvQty || 0);
        const freeRecvQty = Number(item.FreeRecvQty || 0);

        const totalStrips = recvQty + freeRecvQty;

        const effectiveStripCost =
          totalStrips > 0 ? (cp * recvQty) / totalStrips : cp;

        const cpu =
          noQtyPerStrip > 0
            ? Number((effectiveStripCost / noQtyPerStrip).toFixed(4))
            : effectiveStripCost;
        const mrpu =
          noQtyPerStrip > 0 ? Number((mrp / noQtyPerStrip).toFixed(4)) : mrp;
        await this.picasoStrStockdetailsModel.create(
          {
            InvoiceDate: new Date(common.InvoiceDate),
            StockID: nextStockId,
            StockNo: stockNo,
            RecieptNo: common.RecieptNo || '',

            ItemTypeID: Number(item.ItemTypeID || 0),
            ItemID: item.ItemID ? Number(item.ItemID) : 0,
            ItemName: item.ItemName || '',
            BatchNo: item.BatchNo || '',

            SupplierName: common.SupplierName || '',
            SupplierID: Number(common.SupplierID || 0),
            CentreID: Number(common.CentreID || 0),

            CGST: Number(item.CGST || 0),
            SGST: Number(item.SGST || 0),
            CGSTAmount: Number(item.CGSTAmount || 0),
            SGSTAmount: Number(item.SGSTAmount || 0),

            MenufacturingDate: item.MenufacturingDate
              ? new Date(item.MenufacturingDate)
              : null,
            ExpiryDate: item.ExpiryDate ? new Date(item.ExpiryDate) : null,

            RagNo: common.RagNo || '',
            HSNCode: item.HSNCode || '',

            TotalAmount: Number(item.totalCp || 0),
            TotalDiscount: Number(item.DiscountAmt || 0),
            GrandTotal: Number(item.total || 0),

            NoStrip: noStrip,
            NoQtyperStrip: noQtyPerStrip,

            CPperStrip: cp,
            MRPperStrip: mrp,

            CP: cp,
            MRP: Number(mrp.toFixed(4)),

            CPU: Number(cpu.toFixed(4)),
            MRPU: Number(mrpu.toFixed(4)),

            FreeRecvQty: Number(item.FreeRecvQty || 0),
            RecvQty: Number(item.RecvQty || 0),

            DiscountPCperitem: Number(item.DiscountPercent || 0),
            Discountperitem: Number(item.DiscountAmt || 0),

            BalQty: Number(item.RecvQty || 0) + Number(item.FreeRecvQty || 0),
            IssueQty: 0,
            CondmQty: 0,
            ReturnQty: 0,

            IsDeathStock: 0,
            Remarks: common.Remarks || '',

            UserloginID: requestingUser.id ? Number(requestingUser.id) : 0,
            AddedBy: requestingUser.id ? Number(requestingUser.id) : 0,
            AddedDate: new Date(),
            ModifiedDate: null,
            ModifiedBy: null,
            Isopen: false,
            StockStatus: 0,
            IsActive: true,
            tenant_id: requestingUser.tenantId,
            center_id: requestingUser.centerId,
          },
          { transaction },
        );
      }

      await transaction.commit();

      return {
        message: 'Stock saved successfully',
      };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        error?.message || 'Failed to add stock details',
      );
    }
  }
  async viewStockBills(requestingUser: any, filters: any) {
    const {
      page = 1,
      limit = 20,
      startDate: fromDate,
      endDate: toDate,
      RecieptNo,
      ItemTypeID,
      descriptions,
      SupplierID,
      StockID,
      ItemID,
    } = filters;
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
      this.picasoStrStockdetailsModel,
    );

    const where: any = {
      ...scopeWhere,
    };
    const hasUserFilters = Object.values({
      fromDate,
      toDate,
      RecieptNo,
      ItemTypeID,
      descriptions,
      SupplierID,
      StockID,
      ItemID,
    }).some((v) => v !== undefined && v !== null && v !== '');

    if (!hasUserFilters) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);

      const end = new Date();
      end.setHours(23, 59, 59, 999);
      where.AddedDate = { [Op.between]: [start, end] };
    }

    if (RecieptNo) where.RecieptNo = { [Op.iLike]: `%${RecieptNo}%` };
    if (ItemTypeID) where.ItemTypeID = Number(ItemTypeID);
    if (descriptions) where.ItemName = { [Op.iLike]: `%${descriptions}%` };
    if (SupplierID) where.SupplierID = Number(SupplierID);
    if (StockID) where.StockID = Number(StockID);
    if (ItemID) where.ItemID = Number(ItemID);
    const parseDate = (val: string): Date | null => {
      if (!val) return null;
      const parsed = new Date(val);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;

    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    if (from && to) {
      where.InvoiceDate = {
        [Op.between]: [from, to],
      };
    } else if (from) {
      where.InvoiceDate = {
        [Op.gte]: from,
      };
    } else if (to) {
      where.InvoiceDate = {
        [Op.lte]: to,
      };
    }
    const { rows, count } =
      await this.picasoStrStockdetailsModel.findAndCountAll({
        where,
        limit: pageSize,
        offset,
        order: [['ID', 'DESC']],
      });
    const allFilteredRows = await this.picasoStrStockdetailsModel.findAll({
      where,
      attributes: [
        'CP',
        'MRP',
        'RecvQty',
        'FreeRecvQty',
        'BalQty',
        'IssueQty',
        'CondmQty',
        'NoStrip',
        'CPU',
      ],
      raw: true,
    });
    const summary = allFilteredRows.reduce(
      (acc: any, b: any) => {
        const cp = this.parseCurrency(b.CP || 0);
        const mrp = this.parseCurrency(b.MRP || 0);

        const recvQty = Number(b.RecvQty || 0);
        const freeRecvQty = Number(b.FreeRecvQty || 0);
        const balQty = Number(b.BalQty || 0);
        const issueQty = Number(b.IssueQty || 0);
        const condmQty = Number(b.CondmQty || 0);
        const noStrip = Number(b.NoStrip || 1);
        const cpu = this.parseCurrency(b.CPU || 0);
        acc.totalCostPrice += cp * noStrip;

        acc.totalMrp += mrp * noStrip;

        acc.totalRemainingCostPrice += cpu * balQty;

        acc.totalSalesAmount += cpu * issueQty;

        acc.totalRecvQty += recvQty;

        acc.totalRecvFreeQty += freeRecvQty;

        acc.totalBalQty += recvQty + freeRecvQty - issueQty;

        acc.totalSalesQty += issueQty;

        acc.totalCondQty += condmQty;

        if (balQty < 5) {
          acc.lowStock += 1;
        }

        return acc;
      },
      {
        totalCostPrice: 0,
        totalMrp: 0,
        totalRemainingCostPrice: 0,
        totalSalesAmount: 0,
        totalRecvQty: 0,
        totalRecvFreeQty: 0,
        totalBalQty: 0,
        totalSalesQty: 0,
        totalCondQty: 0,
        lowStock: 0,
      },
    );
    return {
      data: rows,
      summary,
      pagination: {
        currentPage: pageNumber,
        pageSize,
        totalRecords: count,
        totalPages: Math.ceil(count / pageSize),
      },
    };
  }
  async getExpiryItems(requestingUser: any, filters: any) {
    const { page = 1, limit = 20 } = filters;

    const offset = (page - 1) * limit;
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.picasoStrStockdetailsModel,
    );
    const today = new Date();
    const ninetyDaysLater = new Date();
    ninetyDaysLater.setDate(today.getDate() + 90);

    const where: any = {
      ...scopeWhere,

      ExpiryDate: {
        [Op.between]: [today, ninetyDaysLater],
      },
    };

    const { rows, count } =
      await this.picasoStrStockdetailsModel.findAndCountAll({
        where,
        limit: +limit,
        offset,
        order: [['ExpiryDate', 'ASC']], // better UX
      });

    return {
      data: rows,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        limit,
      },
    };
  }

  async viewSaleMedicineStockBills(user: any, filters: any) {
    const { startDate, endDate, AddedBy, descriptions, CustommerName, BillNo } =
      filters;

    const pageNumber = Math.max(Number(filters.page) || 1, 1);
    const limitNumber = Math.max(Number(filters.limit) || 20, 1);

    const offset = (pageNumber - 1) * limitNumber;
    const scopeWhere = buildScopeWhere(
      {
        id: user.id,
        role: user.role,
        tenant_id: user.tenantId,
        center_id: user.centerId,
      },
      this.picasoOpdPhrgBillHeaderModel,
    );

    const headerWhere: any = {
      ...scopeWhere,
      IsActive: '1',
    };
    const footerWhere: any = {};

    /* -----------------------------
     Header Filters
  ------------------------------*/

    if (CustommerName) {
      headerWhere.CustommerName = CustommerName;
    }

    if (AddedBy) {
      headerWhere.AddedBy = Number(AddedBy);
    }

    if (BillNo) {
      headerWhere.BillNo = BillNo;
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
      CustommerName,
      BillNo,
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

    // const headerTotals = (await this.picasoOpdPhrgBillHeaderModel.findOne({
    //   raw: true,
    //   attributes: [
    //     [
    //       Sequelize.literal(
    //         'COALESCE(SUM("DiscountAmount"::numeric), 0::numeric)',
    //       ),
    //       'totalDiscount',
    //     ],
    //     [
    //       Sequelize.literal('COALESCE(SUM("PaidAmount"::numeric), 0::numeric)'),
    //       'totalPaid',
    //     ],
    //   ],
    //   where: headerWhere,
    // })) as any;
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
  async getPatientNameFromBillHeader(
    requestingUser: any,
    params: { search?: string },
  ) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.picasoOpdPhrgBillHeaderModel,
    );

    const headerWhere: any = {
      ...scopeWhere,
      IsActive: '1',
    };
    if (params.search) {
      headerWhere.CustommerName = {
        [Op.iLike]: `%${params.search}%`,
      };
    }

    const { rows, count } =
      await this.picasoOpdPhrgBillHeaderModel.findAndCountAll({
        where: headerWhere,
        attributes: [
          [
            Sequelize.fn('DISTINCT', Sequelize.col('CustommerName')),
            'CustommerName',
          ],
        ],
        order: [['CustommerName', 'ASC']],
        limit: 20,
        raw: true,
      });

    return {
      data: rows,
      totalRecords: count,
    };
  }

  async updateStockDetails(id: number, payload: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const { items, ...common } = payload;

      const existing = await this.picasoStrStockdetailsModel.findByPk(id, {
        transaction,
      });

      if (!existing) {
        throw new Error('Stock record not found');
      }

      const item = items?.[0];
      if (!item) {
        throw new Error('Item data missing');
      }

      const noQtyPerStrip = Number(item.NoQtyperStrip || 1);
      const cp = Number(item.CP || 0);
      const mrp = Number(item.MRP || 0);

      const recvQty = Number(item.RecvQty || 0);
      const freeRecvQty = Number(item.FreeRecvQty || 0);

      const totalStrips = recvQty + freeRecvQty;

      const effectiveStripCost =
        totalStrips > 0 ? (cp * recvQty) / totalStrips : cp;

      const cpu =
        noQtyPerStrip > 0
          ? Number((effectiveStripCost / noQtyPerStrip).toFixed(4))
          : effectiveStripCost;

      const mrpu =
        noQtyPerStrip > 0 ? Number((mrp / noQtyPerStrip).toFixed(4)) : mrp;

      await existing.update(
        {
          InvoiceDate: common.InvoiceDate
            ? new Date(common.InvoiceDate)
            : existing.InvoiceDate,

          RecieptNo: common.RecieptNo ?? existing.RecieptNo,

          ItemTypeID: Number(item.ItemTypeID || existing.ItemTypeID),
          ItemID: Number(item.ItemID || existing.ItemID),
          ItemName: item.ItemName ?? existing.ItemName,
          BatchNo: item.BatchNo ?? existing.BatchNo,

          SupplierID: Number(common.SupplierID || existing.SupplierID),
          SupplierName: common.SupplierName ?? existing.SupplierName,

          CGST: Number(item.CGST ?? existing.CGST),
          SGST: Number(item.SGST ?? existing.SGST),
          CGSTAmount: Number(item.CGSTAmount ?? existing.CGSTAmount),
          SGSTAmount: Number(item.SGSTAmount ?? existing.SGSTAmount),

          MenufacturingDate: item.MenufacturingDate
            ? new Date(item.MenufacturingDate)
            : existing.MenufacturingDate,

          ExpiryDate: item.ExpiryDate
            ? new Date(item.ExpiryDate)
            : existing.ExpiryDate,

          RagNo: common.RagNo ?? existing.RagNo,
          HSNCode: item.HSNCode ?? existing.HSNCode,

          TotalAmount: Number(item.totalCp ?? existing.TotalAmount),
          TotalDiscount: Number(item.DiscountAmt ?? existing.TotalDiscount),
          GrandTotal: Number(item.total ?? existing.GrandTotal),

          NoStrip: Number(item.NoStrip ?? existing.NoStrip),
          NoQtyperStrip: noQtyPerStrip,

          CPperStrip: cp,
          MRPperStrip: mrp,
          CP: cp,
          MRP: Number(mrp.toFixed(4)),
          CPU: Number(cpu.toFixed(4)),
          MRPU: Number(mrpu.toFixed(4)),

          FreeRecvQty: Number(item.FreeRecvQty ?? existing.FreeRecvQty),
          RecvQty: Number(item.RecvQty ?? existing.RecvQty),

          DiscountPCperitem: Number(
            item.DiscountPercent ?? existing.DiscountPCperitem,
          ),
          Discountperitem: Number(item.DiscountAmt ?? existing.Discountperitem),

          BalQty:
            Number(item.RecvQty || 0) +
            Number(item.FreeRecvQty || 0) -
            Number(common.IssueQty || existing.IssueQty || 0),

          ModifiedDate: new Date(),
          ModifiedBy: common.ModifiedBy,
        },
        { transaction },
      );

      await transaction.commit();

      return { message: 'Stock Updated Successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        error?.message || 'Failed to update stock',
      );
    }
  }
  async deleteStockDetails(id: number) {
    const transaction = await this.sequelize.transaction();

    try {
      const existing = await this.picasoStrStockdetailsModel.findByPk(id, {
        transaction,
      });

      if (!existing) {
        throw new Error('Stock record not found');
      }

      await this.picasoStrStockdetailsModel.destroy({
        where: { ID: id },
        transaction,
      });

      await transaction.commit();

      return { message: 'Stock Deleted Successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(
        error?.message || 'Failed to delete stock',
      );
    }
  }
  async addPhramaBilling(requestingUser: any, payload: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const { items, ...header } = payload;
      const currentYear = new Date().getFullYear();
      const lastRecord = await this.picasoOpdPhrgBillHeaderModel.findOne({
        order: [['ID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const nextId = Number(lastRecord?.ID || 0) + 1;

      const lastBill = await this.picasoOpdPhrgBillHeaderModel.findOne({
        order: [['BillHeadID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const nextBillHeadId = Number(lastBill?.BillHeadID || 0) + 1;

      const createdHeader = await this.picasoOpdPhrgBillHeaderModel.create(
        {
          ID: nextId,
          BillHeadID: nextBillHeadId,
          BillNo: String(nextBillHeadId),

          PicasoID: header.UHID || null,
          CustommerName: header.Name || null,
          Ages: header.Age || null,
          PatientType: header.FinCategory || null,
          Gender: header.Gender || null,
          Mobileno: header.Mobile || null,
          OPDBillNo: header.opdBillNo || null,

          TotalQty: Number(header.totalQuantity || 0),

          PayMode: Number(header.payMode || 0),

          CashAmount: Number(header.cashAmount || 0),
          CardAmount: Number(header.cardAmount || 0),
          ChequeAmount: Number(header.chequeAmount || 0),

          TotalAmount: Number(header.totalAmount || 0),
          DiscountAmount: Number(header.totalDiscount || 0),

          PaidAmount: Number(header.paidAmount || 0),

          BalanceAmount:
            Number(header.totalAmount || 0) - Number(header.paidAmount || 0),

          CGSTAmount: Number(header.cgstAmount || 0),
          SGSTAmount: Number(header.sgstAmount || 0),

          TaxableAmount: Number(header.taxableAmount || 0),
          GrossAmount: Number(header.grossAmount || 0),

          InitialPaidAmount: Number(header.paidAmount || 0),

          HospitalID: Number(header.hospitalId || 1),
          FinancialYearID: currentYear,

          AddedBy: Number(requestingUser.id) || Number(header.AddedBy || 1),
          AddedDate: new Date(),

          IsActive: '1',
          center_id: requestingUser.centerId,
          tenant_id: requestingUser.tenantId,
        },
        { transaction },
      );
      const lastFooter = await this.picasoOpdPhrfBillFooterModel.findOne({
        order: [['BillFooterID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let nextFooterId = Number(lastFooter?.BillFooterID || 0) + 1;

      if (items && items.length) {
        for (const item of items) {
          const stock = await this.picasoStrStockdetailsModel.findOne({
            where: {
              ID: Number(item.stockDetailId),
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!stock) {
            throw new Error(`Stock not found for ${item.description}`);
          }
          if (Number(item.qty) <= 0) {
            throw new Error(`Invalid quantity for ${item.description}`);
          }
          const finalQty =
            Number(stock.RecvQty + stock.FreeRecvQty) - Number(stock.IssueQty);
          if (finalQty < Number(item.qty)) {
            throw new Error(
              `Insufficient stock for ${item.description}, count is ${finalQty}`,
            );
          }

          // reduce balance
          stock.BalQty = Number(stock.BalQty || 0) - Number(item.qty || 0);

          // increase issued qty
          stock.IssueQty = Number(stock.IssueQty || 0) + Number(item.qty || 0);

          await stock.save({ transaction });
          const profit =
            Number(item.total || 0) -
            Number(item.basePrice || 0) * Number(item.qty || 0);
          await this.picasoOpdPhrfBillFooterModel.create(
            {
              BillFooterID: nextFooterId++,
              BillHeadID: createdHeader.BillHeadID,
              BillNo: createdHeader.BillNo,
              CustomerName: header.Name || null,
              PatientType: header.FinCategory || null,
              ItemID: Number(item.itemId || 0),
              StockID: Number(item.stockId || 0),
              StockNo: item.stockNo || null,
              ItemName: item.description || null,
              IssueQty: Number(item.qty || 0),
              BatchNo: item.batchNo || null,
              HSNCode: item.hsn || null,
              ExpiryDate: item.expDate || null,
              Rate: Number(item.saleRate || 0),
              Baseprice: Number(item.basePrice || 0),
              DiscountPC: Number(item.discountPercent || 0),
              DiscountAmt: Number(item.discAmt || 0),
              CGST: String(item.cgstPercent || 0),
              SGST: String(item.sgstPercent || 0),
              CGSTAmount: Number(item.cgstAmt || 0),
              SGSTAmount: Number(item.sgstAmt || 0),
              TaxableAmount: Number(item.taxableAmt || 0),
              TotalAmount: Number(item.total || 0),
              NetAmount: Number(item.total || 0),
              PaidAmount: Number(item.total || 0),
              DueAmount: 0,
              ProfitAmount: profit,
              HospitalID: Number(header.hospitalId || 1),
              FinancialYearID: currentYear,
              AddedBy: Number(header.AddedBy || 1),
              AddedDate: new Date(),
              IsActive: 1,
            },
            { transaction },
          );
        }
      }
      await transaction.commit();

      return {
        message: 'Bill Saved Successfully',
        data: createdHeader,
      };
    } catch (error: any) {
      await transaction.rollback();

      throw new InternalServerErrorException(
        error?.message || 'Failed to save bill',
      );
    }
  }

  async getPharmaBillById(requestingUser: any, id: number) {
    try {
      const parseMoney = (val: any) => {
        if (!val) return 0;
        return Number(String(val).replace(/[^0-9.-]+/g, ''));
      };
      const scopeWhere = buildScopeWhere(
        {
          id: requestingUser.id,
          role: requestingUser.role,
          tenant_id: requestingUser.tenantId,
          center_id: requestingUser.centerId,
        },
        this.picasoOpdPhrgBillHeaderModel,
      );

      const header = await this.picasoOpdPhrgBillHeaderModel.findOne({
        where: {
          ID: id,
          IsActive: '1',
          ...scopeWhere,
        },
        include: [
          {
            model: PicasoOpdPhrfBillFooterModel,
            as: 'footerItems',
          },
        ],
      });

      if (!header) {
        throw new Error('Bill not found');
      }

      const cleanedHeader = {
        ...header.toJSON(),

        TotalAmount: parseMoney(header.TotalAmount),
        DiscountAmount: parseMoney(header.DiscountAmount),
        PaidAmount: parseMoney(header.PaidAmount),
        BalanceAmount: parseMoney(header.BalanceAmount),

        CGSTAmount: parseMoney(header.CGSTAmount),
        SGSTAmount: parseMoney(header.SGSTAmount),
        TaxableAmount: parseMoney(header.TaxableAmount),
        GrossAmount: parseMoney(header.GrossAmount),

        CashAmount: parseMoney(header.CashAmount),
        CardAmount: parseMoney(header.CardAmount),
        ChequeAmount: parseMoney(header.ChequeAmount),
      };
      const cleanedItems = (header.footerItems || []).map((item: any) => ({
        ...item.toJSON(),

        Rate: parseMoney(item.Rate),
        Baseprice: parseMoney(item.Baseprice),

        CGSTAmount: parseMoney(item.CGSTAmount),
        SGSTAmount: parseMoney(item.SGSTAmount),

        TaxableAmount: parseMoney(item.TaxableAmount),

        DiscountPC: parseMoney(item.DiscountPC),
        DiscountAmt: parseMoney(item.DiscountAmt),

        TotalAmount: parseMoney(item.TotalAmount),
        NetAmount: parseMoney(item.NetAmount),
        PaidAmount: parseMoney(item.PaidAmount),

        ProfitAmount: parseMoney(item.ProfitAmount),
        DueAmount: parseMoney(item.DueAmount),
      }));

      return {
        header: cleanedHeader,
        items: cleanedItems,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch bill',
      );
    }
  }
  async updatePharmaBilling(id: number, payload: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const { items, ...header } = payload;
      const currentYear = new Date().getFullYear();

      const bill = await this.picasoOpdPhrgBillHeaderModel.findByPk(id, {
        transaction,
      });

      if (!bill) {
        throw new Error('Bill not found');
      }

      await bill.update(
        {
          PicasoID: header.UHID || null,
          CustommerName: header.Name || null,
          Ages: header.Age || null,
          Gender: header.Gender || null,
          PatientType: header.FinCategory || null,
          Mobileno: header.Mobile || null,
          OPDBillNo: header.opdBillNo || null,
          TotalQty: Number(header.totalQuantity || 0),
          PayMode: Number(header.payMode || 0),
          CashAmount: Number(header.cashAmount || 0),
          CardAmount: Number(header.cardAmount || 0),
          ChequeAmount: Number(header.chequeAmount || 0),
          TotalAmount: Number(header.totalAmount || 0),
          DiscountAmount: Number(header.totalDiscount || 0),
          PaidAmount: Number(header.paidAmount || 0),
          BalanceAmount:
            Number(header.totalAmount || 0) - Number(header.paidAmount || 0),
          CGSTAmount: Number(header.cgstAmount || 0),
          SGSTAmount: Number(header.sgstAmount || 0),
          TaxableAmount: Number(header.taxableAmount || 0),
          GrossAmount: Number(header.grossAmount || 0),
          ModifiedDate: new Date(),
        },
        { transaction },
      );
      const oldItems = await this.picasoOpdPhrfBillFooterModel.findAll({
        where: {
          BillHeadID: bill.BillHeadID,
        },
        transaction,
      });

      for (const oldItem of oldItems) {
        const stock = await this.picasoStrStockdetailsModel.findOne({
          where: {
            StockID: Number(oldItem.StockID),
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (stock) {
          // restore stock
          stock.BalQty =
            Number(stock.BalQty || 0) + Number(oldItem.IssueQty || 0);

          stock.IssueQty = Math.max(
            0,
            Number(stock.IssueQty || 0) - Number(oldItem.IssueQty || 0),
          );
          await stock.save({ transaction });
        }
      }
      await this.picasoOpdPhrfBillFooterModel.destroy({
        where: { BillHeadID: bill.BillHeadID },
        transaction,
      });

      const lastFooter = await this.picasoOpdPhrfBillFooterModel.findOne({
        order: [['BillFooterID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let nextFooterId = Number(lastFooter?.BillFooterID || 0) + 1;

      for (const item of items) {
        const stock = await this.picasoStrStockdetailsModel.findOne({
          where: {
            StockID: Number(item.stockId),
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!stock) {
          throw new Error(`Stock not found for ${item.description}`);
        }

        if (Number(item.qty) <= 0) {
          throw new Error(`Invalid quantity for ${item.description}`);
        }

        const finalQty =
          Number(stock.RecvQty + stock.FreeRecvQty) - Number(stock.IssueQty);
        if (finalQty < Number(item.qty)) {
          throw new Error(`Insufficient stock for ${item.description}`);
        }

        // deduct stock again
        stock.BalQty = Number(stock.BalQty || 0) - Number(item.qty || 0);

        // increase issued qty
        stock.IssueQty = Number(stock.IssueQty || 0) + Number(item.qty || 0);

        await stock.save({ transaction });
        const profit =
          Number(item.total || 0) -
          Number(item.basePrice || 0) * Number(item.qty || 0);

        await this.picasoOpdPhrfBillFooterModel.create(
          {
            BillFooterID: nextFooterId++,
            BillHeadID: bill.BillHeadID,
            BillNo: bill.BillNo,
            CustomerName: header.Name || null,
            PatientType: header.FinCategory || null,
            ItemID: Number(item.itemId || 0),
            StockID: Number(item.stockId || 0),
            StockNo: item.stockNo || null,
            ItemName: item.description || null,
            IssueQty: Number(item.qty || 0),
            BatchNo: item.batchNo || null,
            HSNCode: item.hsn || null,
            ExpiryDate: item.expDate || null,
            Rate: Number(item.saleRate || 0),
            Baseprice: Number(item.basePrice || 0),
            DiscountPC: Number(item.discountPercent || 0),
            DiscountAmt: Number(item.discAmt || 0),
            CGST: String(item.cgstPercent || 0),
            SGST: String(item.sgstPercent || 0),
            CGSTAmount: Number(item.cgstAmt || 0),
            SGSTAmount: Number(item.sgstAmt || 0),
            TaxableAmount: Number(item.taxableAmt || 0),
            TotalAmount: Number(item.total || 0),
            NetAmount: Number(item.total || 0),
            PaidAmount: Number(item.total || 0),
            ProfitAmount: profit,
            HospitalID: Number(header.hospitalId || 1),
            FinancialYearID: currentYear,
            AddedBy: Number(header.AddedBy || 1),
            AddedDate: new Date(),
            IsActive: 1,
          },
          { transaction },
        );
      }

      await transaction.commit();
      return { message: 'Bill Updated Successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(error.message);
    }
  }
  async getLowStockItems(requestingUser: any) {
    try {
      const scopeWhere = buildScopeWhere(
        {
          id: requestingUser.id,
          role: requestingUser.role,
          tenant_id: requestingUser.tenantId,
          center_id: requestingUser.centerId,
        },
        this.picasoStrStockdetailsModel,
      );

      const items = await this.picasoStrStockdetailsModel.findAll({
        where: {
          ...scopeWhere,
          BalQty: {
            [Op.between]: [0, 5],
          },
        },
        order: [['BalQty', 'ASC']],
      });

      return {
        data: items,
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to fetch low stock items');
    }
  }
  private parseCurrency = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    const cleaned = String(value).replace(/[^0-9.-]+/g, '');

    const parsed = Number(cleaned);

    return isNaN(parsed) ? 0 : parsed;
  };

  async addPhramacampBilling(requestingUser: any, payload: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const { items, ...header } = payload;
      const currentYear = new Date().getFullYear();
      const lastRecord = await this.picasoOpdPhrgcampBillHeaderModel.findOne({
        order: [['ID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const nextId = Number(lastRecord?.ID || 0) + 1;

      const lastBill = await this.picasoOpdPhrgcampBillHeaderModel.findOne({
        order: [['BillHeadID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const nextBillHeadId = Number(lastBill?.BillHeadID || 0) + 1;

      const createdHeader = await this.picasoOpdPhrgcampBillHeaderModel.create(
        {
          ID: nextId,
          BillHeadID: nextBillHeadId,
          BillNo: String(nextBillHeadId),

          PicasoID: header.UHID || null,
          CustommerName: header.Name || null,
          Ages: header.Age || null,
          PatientType: header.FinCategory || null,
          Gender: header.Gender || null,
          Mobileno: header.Mobile || null,
          OPDBillNo: header.opdBillNo || null,

          TotalQty: Number(header.totalQuantity || 0),

          PayMode: Number(header.payMode || 0),

          CashAmount: Number(header.cashAmount || 0),
          CardAmount: Number(header.cardAmount || 0),
          ChequeAmount: Number(header.chequeAmount || 0),

          TotalAmount: Number(header.totalAmount || 0),
          DiscountAmount: Number(header.totalDiscount || 0),

          PaidAmount: Number(header.paidAmount || 0),

          BalanceAmount:
            Number(header.totalAmount || 0) - Number(header.paidAmount || 0),

          CGSTAmount: Number(header.cgstAmount || 0),
          SGSTAmount: Number(header.sgstAmount || 0),

          TaxableAmount: Number(header.taxableAmount || 0),
          GrossAmount: Number(header.grossAmount || 0),

          InitialPaidAmount: Number(header.paidAmount || 0),

          HospitalID: Number(header.hospitalId || 1),
          FinancialYearID: currentYear,

          AddedBy: Number(requestingUser.id) || Number(header.AddedBy || 1),
          AddedDate: new Date(),

          IsActive: '1',
          center_id: requestingUser.centerId,
          tenant_id: requestingUser.tenantId,
        },
        { transaction },
      );
      const lastFooter = await this.picasoOpdPhrfcampBillFooterModel.findOne({
        order: [['BillFooterID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let nextFooterId = Number(lastFooter?.BillFooterID || 0) + 1;
      if (items && items.length) {
        for (const item of items) {
          const stock = await this.picasoStrStockdetailsModel.findOne({
            where: {
              ID: Number(item.stockDetailId),
            },
            transaction,
            lock: transaction.LOCK.UPDATE,
          });

          if (!stock) {
            throw new Error(`Stock not found for ${item.description}`);
          }
          if (Number(item.qty) <= 0) {
            throw new Error(`Invalid quantity for ${item.description}`);
          }
          const finalQty =
            Number(stock.RecvQty + stock.FreeRecvQty) - Number(stock.IssueQty);
          if (finalQty < Number(item.qty)) {
            throw new Error(`Insufficient stock for ${item.description}`);
          }

          // reduce balance
          stock.BalQty = Number(stock.BalQty || 0) - Number(item.qty || 0);

          // increase issued qty
          stock.IssueQty = Number(stock.IssueQty || 0) + Number(item.qty || 0);

          await stock.save({ transaction });
          const profit =
            Number(item.total || 0) -
            Number(item.basePrice || 0) * Number(item.qty || 0);
          await this.picasoOpdPhrfcampBillFooterModel.create(
            {
              BillFooterID: nextFooterId++,
              BillHeadID: createdHeader.BillHeadID,
              BillNo: createdHeader.BillNo,
              CustomerName: header.Name || null,
              PatientType: header.FinCategory || null,
              ItemID: Number(item.itemId || 0),
              StockID: Number(item.stockId || 0),
              StockNo: item.stockNo || null,
              ItemName: item.description || null,
              IssueQty: Number(item.qty || 0),
              BatchNo: item.batchNo || null,
              HSNCode: item.hsn || null,
              ExpiryDate: item.expDate || null,
              Rate: Number(item.saleRate || 0),
              Baseprice: Number(item.basePrice || 0),
              DiscountPC: Number(item.discountPercent || 0),
              DiscountAmt: Number(item.discAmt || 0),
              CGST: String(item.cgstPercent || 0),
              SGST: String(item.sgstPercent || 0),
              CGSTAmount: Number(item.cgstAmt || 0),
              SGSTAmount: Number(item.sgstAmt || 0),
              TaxableAmount: Number(item.taxableAmt || 0),
              TotalAmount: Number(item.total || 0),
              NetAmount: Number(item.total || 0),
              PaidAmount: Number(item.total || 0),
              DueAmount: 0,
              ProfitAmount: profit,
              HospitalID: Number(header.hospitalId || 1),
              FinancialYearID: currentYear,
              AddedBy: Number(header.AddedBy || 1),
              AddedDate: new Date(),
              IsActive: 1,
            },
            { transaction },
          );
        }
      }
      await transaction.commit();

      return {
        message: 'Bill Saved Successfully',
        data: createdHeader,
      };
    } catch (error: any) {
      await transaction.rollback();

      throw new InternalServerErrorException(
        error?.message || 'Failed to save bill',
      );
    }
  }

  async getPharmacampBillById(requestingUser: any, id: number) {
    try {
      const parseMoney = (val: any) => {
        if (!val) return 0;
        return Number(String(val).replace(/[^0-9.-]+/g, ''));
      };
      const scopeWhere = buildScopeWhere(
        {
          id: requestingUser.id,
          role: requestingUser.role,
          tenant_id: requestingUser.tenantId,
          center_id: requestingUser.centerId,
        },
        this.picasoOpdPhrgcampBillHeaderModel,
      );

      const header = await this.picasoOpdPhrgcampBillHeaderModel.findOne({
        where: { ID: id, ...scopeWhere },
        include: [
          {
            model: PicasoOpdPhrfcampBillFooterModel,
            as: 'footerItems',
          },
        ],
      });

      if (!header) {
        throw new Error('Bill not found');
      }

      const cleanedHeader = {
        ...header.toJSON(),

        TotalAmount: parseMoney(header.TotalAmount),
        DiscountAmount: parseMoney(header.DiscountAmount),
        PaidAmount: parseMoney(header.PaidAmount),
        BalanceAmount: parseMoney(header.BalanceAmount),

        CGSTAmount: parseMoney(header.CGSTAmount),
        SGSTAmount: parseMoney(header.SGSTAmount),
        TaxableAmount: parseMoney(header.TaxableAmount),
        GrossAmount: parseMoney(header.GrossAmount),

        CashAmount: parseMoney(header.CashAmount),
        CardAmount: parseMoney(header.CardAmount),
        ChequeAmount: parseMoney(header.ChequeAmount),
      };
      const cleanedItems = (header.footerItems || []).map((item: any) => ({
        ...item.toJSON(),

        Rate: parseMoney(item.Rate),
        Baseprice: parseMoney(item.Baseprice),

        CGSTAmount: parseMoney(item.CGSTAmount),
        SGSTAmount: parseMoney(item.SGSTAmount),

        TaxableAmount: parseMoney(item.TaxableAmount),

        DiscountPC: parseMoney(item.DiscountPC),
        DiscountAmt: parseMoney(item.DiscountAmt),

        TotalAmount: parseMoney(item.TotalAmount),
        NetAmount: parseMoney(item.NetAmount),
        PaidAmount: parseMoney(item.PaidAmount),

        ProfitAmount: parseMoney(item.ProfitAmount),
        DueAmount: parseMoney(item.DueAmount),
      }));

      return {
        header: cleanedHeader,
        items: cleanedItems,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error?.message || 'Failed to fetch bill',
      );
    }
  }
  async updatePharmacampBilling(id: number, payload: any) {
    const transaction = await this.sequelize.transaction();

    try {
      const { items, ...header } = payload;
      const currentYear = new Date().getFullYear();

      const bill = await this.picasoOpdPhrgcampBillHeaderModel.findByPk(id, {
        transaction,
      });

      if (!bill) {
        throw new Error('Bill not found');
      }

      await bill.update(
        {
          PicasoID: header.UHID || null,
          CustommerName: header.Name || null,
          Ages: header.Age || null,
          Gender: header.Gender || null,
          PatientType: header.FinCategory || null,
          Mobileno: header.Mobile || null,
          OPDBillNo: header.opdBillNo || null,
          TotalQty: Number(header.totalQuantity || 0),
          PayMode: Number(header.payMode || 0),
          CashAmount: Number(header.cashAmount || 0),
          CardAmount: Number(header.cardAmount || 0),
          ChequeAmount: Number(header.chequeAmount || 0),
          TotalAmount: Number(header.totalAmount || 0),
          DiscountAmount: Number(header.totalDiscount || 0),
          PaidAmount: Number(header.paidAmount || 0),
          BalanceAmount:
            Number(header.totalAmount || 0) - Number(header.paidAmount || 0),
          CGSTAmount: Number(header.cgstAmount || 0),
          SGSTAmount: Number(header.sgstAmount || 0),
          TaxableAmount: Number(header.taxableAmount || 0),
          GrossAmount: Number(header.grossAmount || 0),
          ModifiedDate: new Date(),
        },
        { transaction },
      );
      const oldItems = await this.picasoOpdPhrfcampBillFooterModel.findAll({
        where: {
          BillHeadID: bill.BillHeadID,
        },
        transaction,
      });

      for (const oldItem of oldItems) {
        const stock = await this.picasoStrStockdetailsModel.findOne({
          where: {
            StockID: Number(oldItem.StockID),
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (stock) {
          // restore stock
          stock.BalQty =
            Number(stock.BalQty || 0) + Number(oldItem.IssueQty || 0);

          stock.IssueQty = Math.max(
            0,
            Number(stock.IssueQty || 0) - Number(oldItem.IssueQty || 0),
          );
          await stock.save({ transaction });
        }
      }
      await this.picasoOpdPhrfcampBillFooterModel.destroy({
        where: { BillHeadID: bill.BillHeadID },
        transaction,
      });

      const lastFooter = await this.picasoOpdPhrfcampBillFooterModel.findOne({
        order: [['BillFooterID', 'DESC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      let nextFooterId = Number(lastFooter?.BillFooterID || 0) + 1;

      for (const item of items) {
        const stock = await this.picasoStrStockdetailsModel.findOne({
          where: {
            StockID: Number(item.stockId),
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!stock) {
          throw new Error(`Stock not found for ${item.description}`);
        }

        if (Number(item.qty) <= 0) {
          throw new Error(`Invalid quantity for ${item.description}`);
        }

        const finalQty =
          Number(stock.RecvQty + stock.FreeRecvQty) - Number(stock.IssueQty);
        if (finalQty < Number(item.qty)) {
          throw new Error(`Insufficient stock for ${item.description}`);
        }

        // deduct stock again
        stock.BalQty = Number(stock.BalQty || 0) - Number(item.qty || 0);

        // increase issued qty
        stock.IssueQty = Number(stock.IssueQty || 0) + Number(item.qty || 0);

        await stock.save({ transaction });
        const profit =
          Number(item.total || 0) -
          Number(item.basePrice || 0) * Number(item.qty || 0);

        await this.picasoOpdPhrfcampBillFooterModel.create(
          {
            BillFooterID: nextFooterId++,
            BillHeadID: bill.BillHeadID,
            BillNo: bill.BillNo,
            CustomerName: header.Name || null,
            PatientType: header.FinCategory || null,
            ItemID: Number(item.itemId || 0),
            StockID: Number(item.stockId || 0),
            StockNo: item.stockNo || null,
            ItemName: item.description || null,
            IssueQty: Number(item.qty || 0),
            BatchNo: item.batchNo || null,
            HSNCode: item.hsn || null,
            ExpiryDate: item.expDate || null,
            Rate: Number(item.saleRate || 0),
            Baseprice: Number(item.basePrice || 0),
            DiscountPC: Number(item.discountPercent || 0),
            DiscountAmt: Number(item.discAmt || 0),
            CGST: String(item.cgstPercent || 0),
            SGST: String(item.sgstPercent || 0),
            CGSTAmount: Number(item.cgstAmt || 0),
            SGSTAmount: Number(item.sgstAmt || 0),
            TaxableAmount: Number(item.taxableAmt || 0),
            TotalAmount: Number(item.total || 0),
            NetAmount: Number(item.total || 0),
            PaidAmount: Number(item.total || 0),
            ProfitAmount: profit,
            HospitalID: Number(header.hospitalId || 1),
            FinancialYearID: currentYear,
            AddedBy: Number(header.AddedBy || 1),
            AddedDate: new Date(),
            IsActive: 1,
          },
          { transaction },
        );
      }

      await transaction.commit();
      return { message: 'Bill Updated Successfully' };
    } catch (error: any) {
      await transaction.rollback();
      throw new InternalServerErrorException(error.message);
    }
  }

  async viewSaleMedicineStockcampBills(user: any, filters: any) {
    const { startDate, endDate, AddedBy, descriptions, CustommerName, BillNo } =
      filters;

    const pageNumber = Math.max(Number(filters.page) || 1, 1);
    const limitNumber = Math.max(Number(filters.limit) || 20, 1);

    const offset = (pageNumber - 1) * limitNumber;
    const scopeWhere = buildScopeWhere(
      {
        id: user.id,
        role: user.role,
        tenant_id: user.tenantId,
        center_id: user.centerId,
      },
      this.picasoOpdPhrgcampBillHeaderModel,
    );

    const headerWhere: any = {
      ...scopeWhere,
      IsActive: '1',
    };
    const footerWhere: any = {};

    /* -----------------------------
     Header Filters
  ------------------------------*/

    if (CustommerName) {
      headerWhere.CustommerName = CustommerName;
    }

    if (AddedBy) {
      headerWhere.AddedBy = Number(AddedBy);
    }

    if (BillNo) {
      headerWhere.BillNo = BillNo;
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
      CustommerName,
      BillNo,
    }).some((key) => filters[key]);

    if (!hasUserFilters) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      headerWhere.AddedDate = { [Op.between]: [start, end] };
    }

    const { rows, count } =
      await this.picasoOpdPhrgcampBillHeaderModel.findAndCountAll({
        where: headerWhere,
        limit: limitNumber,
        offset,
        distinct: true,
        order: [['ID', 'DESC']],
        include: [
          {
            model: PicasoOpdPhrfcampBillFooterModel,
            as: 'footerItems',
            required: Object.keys(footerWhere).length > 0,
            where:
              Object.keys(footerWhere).length > 0 ? footerWhere : undefined,
          },
        ],
      });

    const footerTotals = (await this.picasoOpdPhrfcampBillFooterModel.findOne({
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
          model: PicasoOpdPhrgcampBillHeaderModel,
          as: 'header',
          required: true,
          attributes: [],
          where: headerWhere,
        },
      ],
      where: Object.keys(footerWhere).length ? footerWhere : undefined,
    })) as any;

    const dueTotals = (await this.picasoOpdPhrgcampBillHeaderModel.findOne({
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

    const headerTotals = (await this.picasoOpdPhrgcampBillHeaderModel.findOne({
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
      pagination: {
        totalRecords: count,
        currentPage: pageNumber,
        totalPages: Math.ceil(count / limitNumber),
        limit: limitNumber,
      },
    };
  }
  async getPatientNameFromcampBillHeader(
    requestingUser: any,
    params: { search?: string },
  ) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.picasoOpdPhrgcampBillHeaderModel,
    );

    const headerWhere: any = {
      ...scopeWhere,
      IsActive: '1',
    };
    if (params.search) {
      headerWhere.CustommerName = {
        [Op.iLike]: `%${params.search}%`,
      };
    }

    const { rows, count } =
      await this.picasoOpdPhrgcampBillHeaderModel.findAndCountAll({
        where: headerWhere,
        attributes: [
          [
            Sequelize.fn('DISTINCT', Sequelize.col('CustommerName')),
            'CustommerName',
          ],
        ],
        order: [['CustommerName', 'ASC']],
        limit: 20,
        raw: true,
      });

    return {
      data: rows,
      totalRecords: count,
    };
  }

  async softDeleteBill(id: number) {
    const transaction = await this.sequelize.transaction();

    try {
      const header = await this.picasoOpdPhrgBillHeaderModel.findByPk(id, {
        transaction,
      });

      if (!header) {
        throw new Error('Bill not found');
      }
      const billItems = await this.picasoOpdPhrfBillFooterModel.findAll({
        where: {
          BillHeadID: header.BillHeadID,
          IsActive: '1',
        },
        transaction,
      });

      for (const item of billItems) {
        const stock = await this.picasoStrStockdetailsModel.findOne({
          where: {
            StockID: Number(item.StockID),
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (stock) {
          stock.BalQty = Number(stock.BalQty || 0) + Number(item.IssueQty || 0);

          stock.IssueQty = Math.max(
            0,
            Number(stock.IssueQty || 0) - Number(item.IssueQty || 0),
          );

          await stock.save({ transaction });
        }
      }
      await header.update(
        {
          IsActive: '0',
          ModifiedDate: new Date(),
        },
        { transaction },
      );

      await this.picasoOpdPhrfBillFooterModel.update(
        {
          IsActive: '0',
          ModifiedDate: new Date(),
        },
        {
          where: {
            BillHeadID: header.BillHeadID,
          },
          transaction,
        },
      );

      await transaction.commit();

      return {
        message: 'Bill deleted successfully',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getaddedBy(requestingUser: any) {
    const conditions: string[] = [`u.status = true`];
    const replacements: any = {};

    if (requestingUser.tenantId) {
      conditions.push(`d."tenant_id" = :tenant_id`);
      replacements.tenant_id = requestingUser.tenantId;
    }

    if (requestingUser.centerId) {
      conditions.push(`d."center_id" = :center_id`);
      replacements.center_id = requestingUser.centerId;
    }

    const [results] = await this.sequelize.query(
      `
    SELECT DISTINCT
      u.id,
      u.name
    FROM "Users" u
    INNER JOIN "picaso_opd_phrgbill_header" d
      ON d."AddedBy" = u.id
    WHERE ${conditions.join(' AND ')}
      AND d."IsActive" = '1'
    ORDER BY u.name ASC
    `,
      {
        replacements,
      },
    );

    return {
      status: true,
      message: 'added-by list fetched successfully',
      data: results,
    };
  }
  async softDeletecampBill(id: number) {
    const transaction = await this.sequelize.transaction();

    try {
      const header = await this.picasoOpdPhrgcampBillHeaderModel.findByPk(id, {
        transaction,
      });

      if (!header) {
        throw new Error('Bill not found');
      }
      const billItems = await this.picasoOpdPhrfcampBillFooterModel.findAll({
        where: {
          BillHeadID: header.BillHeadID,
          IsActive: '1',
        },
        transaction,
      });

      for (const item of billItems) {
        const stock = await this.picasoStrStockdetailsModel.findOne({
          where: {
            StockID: Number(item.StockID),
          },
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (stock) {
          stock.BalQty = Number(stock.BalQty || 0) + Number(item.IssueQty || 0);

          stock.IssueQty = Math.max(
            0,
            Number(stock.IssueQty || 0) - Number(item.IssueQty || 0),
          );

          await stock.save({ transaction });
        }
      }
      await header.update(
        {
          IsActive: '0',
          ModifiedDate: new Date(),
        },
        { transaction },
      );

      await this.picasoOpdPhrfcampBillFooterModel.update(
        {
          IsActive: '0',
          ModifiedDate: new Date(),
        },
        {
          where: {
            BillHeadID: header.BillHeadID,
          },
          transaction,
        },
      );

      await transaction.commit();

      return {
        message: 'Bill deleted successfully',
      };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getcampaddedBy(requestingUser: any) {
    const conditions: string[] = [`u.status = true`];
    const replacements: any = {};

    if (requestingUser.tenantId) {
      conditions.push(`d."tenant_id" = :tenant_id`);
      replacements.tenant_id = requestingUser.tenantId;
    }

    if (requestingUser.centerId) {
      conditions.push(`d."center_id" = :center_id`);
      replacements.center_id = requestingUser.centerId;
    }

    const [results] = await this.sequelize.query(
      `
    SELECT DISTINCT
      u.id,
      u.name
    FROM "Users" u
    INNER JOIN "picaso_opd_phrgcampbill_header" d
      ON d."AddedBy" = u.id
    WHERE ${conditions.join(' AND ')}
      AND d."IsActive" = '1'
    ORDER BY u.name ASC
    `,
      {
        replacements,
      },
    );

    return {
      status: true,
      message: 'added-by list fetched successfully',
      data: results,
    };
  }
  async getSalesAddedBy(requestingUser: any) {
    const billing = await this.getaddedBy(requestingUser);

    const camp = await this.getcampaddedBy(requestingUser);

    const merged: any[] = [...(billing?.data || []), ...(camp?.data || [])];

    const unique = merged.filter(
      (item: any, index: number, self: any[]) =>
        index === self.findIndex((x: any) => x.id === item.id),
    );

    return {
      status: true,
      data: unique.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
  async viewAllSalesBills(requestingUser: any, filters: any) {
    const page = Number(filters.page || 1);
    const limit = Number(filters.limit || 20);

    const billing = await this.viewSaleMedicineStockBills(requestingUser, {
      ...filters,
      page: 1,
      limit: 10000,
    });

    const camp = await this.viewSaleMedicineStockcampBills(requestingUser, {
      ...filters,
      page: 1,
      limit: 10000,
    });

    const billingData = (billing?.data || []).map((row: any) => ({
      ...row.toJSON(),
      Source: 'Billing',
    }));

    const campData = (camp?.data || []).map((row: any) => ({
      ...row.toJSON(),
      Source: 'Camp Billing',
    }));
    const totalIssueQty =
      Number(billing?.totalIssueQty || 0) + Number(camp?.totalIssueQty || 0);

    const totalSales =
      Number(billing?.totalSales || 0) + Number(camp?.totalSales || 0);

    const totalDiscount =
      Number(billing?.totalDiscount || 0) + Number(camp?.totalDiscount || 0);

    const totalPaid =
      Number(billing?.totalPaid || 0) + Number(camp?.totalPaid || 0);

    const totalDue =
      Number(billing?.totalDue || 0) + Number(camp?.totalDue || 0);

    const mergedData = [...billingData, ...campData];

    const unique = mergedData.filter(
      (item, index, self) =>
        index ===
        self.findIndex((x) => x.ID === item.ID && x.Source === item.Source),
    );

    unique.sort(
      (a, b) =>
        new Date(b.AddedDate).getTime() - new Date(a.AddedDate).getTime(),
    );

    const start = (page - 1) * limit;

    const end = start + limit;

    const paginatedData = unique.slice(start, end);

    return {
      data: paginatedData,

      totalIssueQty,
      totalSales,
      totalDiscount,
      totalPaid,
      totalDue,

      totalRecords: unique.length,

      pagination: {
        currentPage: page,
        totalPages: Math.ceil(unique.length / limit),
        totalRecords: unique.length,
        limit,
      },
    };
  }
}
