import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ServiceMaster } from '../../models/ServiceMaster';
import { ServiceTypeMaster } from '../../models/ServiceTypeMaster';
import { Op, Sequelize } from 'sequelize';
import { buildScopeWhere } from 'src/helper/auth.helper';

@Injectable()
export class OpdService {
  constructor(
    @InjectModel(ServiceMaster)
    private readonly serviceMasterModel: typeof ServiceMaster,

    @InjectModel(ServiceTypeMaster)
    private readonly serviceTypeModel: typeof ServiceTypeMaster,
  ) {}

  // ===========================
  // 🔹 SERVICE MASTER METHODS
  // ===========================

  async getAllServiceMasters(requestingUser: any, query: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.serviceMasterModel,
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
        where[orSymbol][innerOrSymbol] = where[orSymbol][innerOrSymbol]
          .map((condition: any) => {
            const { AddedBy, ...rest } = condition;
            return rest;
          })
          .filter((condition: any) => Object.keys(condition).length > 0);
      }
      if (where[orSymbol][innerOrSymbol].length === 0) {
        delete where[orSymbol];
      }
    }
    //  filters
    if (query.ServiceTypeID) where.ServiceTypeID = query.ServiceTypeID;
    if (query.DepartmentID) where.DepartmentID = query.DepartmentID;
    if (query.IsActive !== undefined)
      where.IsActive = query.IsActive === 'true';
    if (query.Code) where.Code = { [Op.iLike]: `%${query.Code}%` };
    if (query.ServiceName)
      where.ServiceName = { [Op.iLike]: `%${query.ServiceName}%` };
    if (query.FinancialYear) where.FinancialYear = query.FinancialYear;
    if (query.HospitalID) where.HospitalID = query.HospitalID;
    // 🔹 Charge range filters
    if (query.minCharge)
      where.ServiceCharge = { [Op.gte]: parseFloat(query.minCharge) };
    if (query.maxCharge) {
      where.ServiceCharge = {
        ...(where.ServiceCharge || {}),
        [Op.lte]: parseFloat(query.maxCharge),
      };
    }

    // 🔹 Optional: filter by DoctorID or IPDServiceType if needed
    if (query.DoctorID) where.DoctorID = query.DoctorID;
    if (query.IPDServiceType) where.IPDServiceType = query.IPDServiceType;

    // 🔹 Pagination
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.page ? (parseInt(query.page) - 1) * limit : 0;

    // 🔹 Sorting
    const sortBy = query.sortBy || 'ID';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';
    const categoryId =
      query.PatientType === "apl"
        ? 1
        : query.PatientType === "bpl"
          ? 2
          : null;
    if(categoryId) where.CategoryID = categoryId;
    return await this.serviceMasterModel.findAll({
      where: {
        ...where,
        
      },
      include: [
        {
          model: this.serviceTypeModel,
          attributes: ['ServiceType'],
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });
  }

  async getServiceMasterById(id: number) {
    const record = await this.serviceMasterModel.findByPk(id, {
      include: [{ model: this.serviceTypeModel, attributes: ['ServiceType'] }],
    });
    if (!record)
      throw new NotFoundException(`Service Master with ID ${id} not found`);
    return record;
  }

  async createServiceMaster(data: any) {
    return await this.serviceMasterModel.create(data);
  }

  async updateServiceMaster(id: number, data: any) {
    const record = await this.serviceMasterModel.findByPk(id);
    if (!record)
      throw new NotFoundException(`Service Master with ID ${id} not found`);
    await record.update(data);
    return { message: 'Service Master updated successfully', record };
  }

  async deleteServiceMaster(id: number) {
    const record = await this.serviceMasterModel.findByPk(id);
    if (!record)
      throw new NotFoundException(`Service Master with ID ${id} not found`);
    await record.update({ IsActive: false });
    return { message: 'Service Master deleted (soft) successfully' };
  }

  // ===========================
  // 🔹 SERVICE TYPE MASTER METHODS
  // ===========================

  async getAllServiceTypes(query: any) {
    const where: any = {};
    if (query.Code) where.Code = { [Op.iLike]: `%${query.Code}%` };
    if (query.ServiceType)
      where.ServiceType = { [Op.iLike]: `%${query.ServiceType}%` };
    if (query.IsActive !== undefined)
      where.IsActive = query.IsActive === 'true';
    const limit = query.limit ? parseInt(query.limit) : 50;
    const offset = query.page ? (parseInt(query.page) - 1) * limit : 0;
    const sortBy = query.sortBy || 'ID';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    return await this.serviceTypeModel.findAll({
      where,
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });
  }

  async getServiceTypeById(id: number) {
    const record = await this.serviceTypeModel.findByPk(id);
    if (!record)
      throw new NotFoundException(`Service Type with ID ${id} not found`);
    return record;
  }

  async createServiceType(data: any) {
    return await this.serviceTypeModel.create(data);
  }

  async updateServiceType(id: number, data: any) {
    const record = await this.serviceTypeModel.findByPk(id);
    if (!record)
      throw new NotFoundException(`Service Type with ID ${id} not found`);
    await record.update(data);
    return { message: 'Service Type updated successfully', record };
  }

  async deleteServiceType(id: number) {
    const record = await this.serviceTypeModel.findByPk(id);
    if (!record)
      throw new NotFoundException(`Service Type with ID ${id} not found`);
    await record.update({ IsActive: false });
    return { message: 'Service Type deleted (soft) successfully' };
  }
}
