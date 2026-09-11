import { DRIVERMASTER } from 'src/models/DriverMaster';
import { InjectModel } from '@nestjs/sequelize';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Op, QueryTypes, WhereOptions } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { GlobalHelper } from 'src/helper/global.helper';
import { buildScopeWhere } from 'src/helper/auth.helper';
import { PicasoOpdDailyPatientListModel } from 'src/models/PicasoOpdDailyPatientList';
@Injectable()
export class PatientService {
  constructor(
    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,
    private sequelize: Sequelize,

    @InjectModel(PicasoOpdDailyPatientListModel)
    private readonly picasoOpdDailyPatientListModel: typeof PicasoOpdDailyPatientListModel,
  ) {}

  async getPatientsRaw(
    requestingUser: any,
    filters: any = {},
    page = 1,
    limit = 10,
  ) {
    try {
      const offset = (page - 1) * limit;
      let whereClause = 'WHERE d."is_deleted" = false';
      const replacements: Record<string, any> = {};
      if (requestingUser.role !== 'LMC_ADMIN') {
        // tenant scoping
        whereClause += ` AND d."tenant_id" = :tenant_id`;
        replacements.tenant_id = requestingUser.tenantId;

        if (requestingUser.role != 'TENANT_ADMIN') {
          whereClause += ` AND d."center_id" = :center_id`;
          replacements.center_id = requestingUser.centerId;
        }
        // STAFF level ownership scoping
        if (requestingUser.role === 'STAFF') {
          whereClause += `
          AND (
            d."createdBy" = :userId
          )
        `;

          replacements.userId = requestingUser.id;
        }
      }
      const textFilters = [
        'external_id',
        'name',
        'category',
        'contactNumber',
        'driver_cetname',
        'idProof_number',
      ];
      for (const field of textFilters) {
        if (filters[field]) {
          whereClause += ` AND d."${field}" ILIKE :${field}`;
          replacements[field] = `%${filters[field]}%`;
        }
      }

      // gender ENUM → cast to text
      if (filters.gender) {
        whereClause += ' AND LOWER(d."gender"::text) = LOWER(:gender)';
        replacements.gender = filters.gender;
      }

      if (filters.startDate && filters.endDate) {
        const [startYear, startMonth, startDay] = filters.startDate
          .split('-')
          .map(Number);

        const [endYear, endMonth, endDay] = filters.endDate
          .split('-')
          .map(Number);

        const startDate = new Date(
          startYear,
          startMonth - 1,
          startDay,
          0,
          0,
          0,
          0,
        );

        // Actual selected end date
        const actualEndDate = new Date(
          endYear,
          endMonth - 1,
          endDay,
          23,
          59,
          59,
          999,
        );

        const today = new Date();

        if (isNaN(startDate.getTime()) || isNaN(actualEndDate.getTime())) {
          throw new Error('Invalid date format.');
        }

        if (startDate > actualEndDate) {
          throw new Error('Start date cannot be after end date.');
        }

        // NEXT DAY for exclusive query
        const queryEndDate = new Date(
          endYear,
          endMonth - 1,
          endDay + 1,
          0,
          0,
          0,
          0,
        );

        whereClause += `
    AND d."createdAt" >= :startDate
    AND d."createdAt" < :endDate
  `;

        replacements.startDate = startDate;
        replacements.endDate = queryEndDate;
      }
      const query = `
      SELECT d.*, u."name" AS "addedby"
      FROM "DRIVERMASTERs" d
      LEFT JOIN "Users" u ON u."id" = d."createdBy"
      ${whereClause}
      ORDER BY d."createdAt" DESC
      LIMIT :limit OFFSET :offset;
    `;

      const countQuery = `
      SELECT COUNT(*)::int AS count
      FROM "DRIVERMASTERs" d
      ${whereClause};
    `;

      const [data, countResult] = await Promise.all([
        this.driverMasterModel.sequelize.query(query, {
          replacements: { ...replacements, limit, offset },
          type: QueryTypes.SELECT,
        }),
        this.driverMasterModel.sequelize.query<{ count: number }>(countQuery, {
          replacements,
          type: QueryTypes.SELECT,
        }),
      ]);

      const totalRecords = countResult?.[0]?.count ?? 0;

      return {
        data,
        pagination: {
          totalRecords,
          currentPage: page,
          totalPages: Math.ceil(totalRecords / limit),
          limit,
        },
      };
    } catch (error: any) {
      console.error('Error fetching patients:', error);

      // Sequelize-safe response
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patients from database.',
      );
    }
  }

  async findByMobile(phoneNumber: string): Promise<DRIVERMASTER[]> {
    try {
      const patient = await this.driverMasterModel.findAll({
        where: { contactNumber: phoneNumber, is_deleted: false },
      });
      if (!patient || patient.length === 0) {
        throw new NotFoundException(
          `Patient with phone number ${phoneNumber} not found`,
        );
      }
      return patient;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patient by mobile',
      );
    }
  }

  async findById(driverID: number): Promise<DRIVERMASTER> {
    try {
      const patient = await this.driverMasterModel.findOne({
        where: { id: driverID, is_deleted: false },
      });
      if (!patient) {
        throw new NotFoundException(`Patient with ID ${driverID} not found`);
      }
      return patient;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patient by ID',
      );
    }
  }

  async findByUniqueId(uniqueId: string): Promise<DRIVERMASTER> {
    try {
      const patient = await this.driverMasterModel.findOne({
        where: { idProof_number: uniqueId, is_deleted: false },
      });
      if (!patient) {
        throw new NotFoundException(
          `Patient with this Identity ${uniqueId} not found`,
        );
      }
      return patient;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patient by unique ID',
      );
    }
  }

  async registerPatient(
    user: any,
    patientData: Partial<DRIVERMASTER>,
  ): Promise<{ message: string; driver?: DRIVERMASTER; status: boolean }> {
    try {
      // const existingPatient = await this.driverMasterModel.findOne({
      //   where: { contactNumber: patientData.contactNumber },
      // });

      // if (existingPatient) {
      //   return {
      //     message: 'Patient already exists.',
      //     driver: existingPatient,
      //     status: false,
      //   };
      // }

      if (patientData.localAddressState) {
        patientData.localAddressState =
          patientData.localAddressState.toUpperCase();
      }

      const getLastCenterId = await DRIVERMASTER.findOne({
        attributes: ['id'],
        order: [['id', 'DESC']],
      });

      const nextId = getLastCenterId ? getLastCenterId.id + 1 : 1;
      const tenantQuery = `
  SELECT id, name
  FROM tenants
  WHERE id = :tenant_id
  LIMIT 1
`;

      const tenantResult = await this.sequelize.query(tenantQuery, {
        replacements: {
          tenant_id: user.tenantId,
        },
        type: QueryTypes.SELECT,
      });

      const tenant: any = tenantResult?.[0];

      if (!tenant) {
        throw new BadRequestException('Invalid tenant');
      }

      const tenantCode = tenant.name
        ?.replace(/\s+/g, '')
        ?.toUpperCase()
        ?.slice(0, 4);

      const external_id = `LMC-${tenantCode}-${nextId}`;

      const newDriver = await this.driverMasterModel.create({
        ...patientData,
        external_id: external_id,
        createdBy: user.id, // In old application we are adding centerid here (Center application)
        tenant_id: user.tenantId,
        center_id: user.centerId,
      });

      await this.addDailyPatientlist(user, newDriver, patientData);
      return {
        message: 'Patient registered successfully.',
        driver: newDriver,
        status: true,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to register patient',
      );
    }
  }

  async findByCreatedDate(filters: {
    date?: string;
    start?: string;
    end?: string;
  }): Promise<DRIVERMASTER[]> {
    try {
      const { date, start, end } = filters;
      let where: any = {};

      if (date) {
        const startOfDay = new Date(date);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [startOfDay, endOfDay] };
      } else if (start && end) {
        where.createdAt = { [Op.between]: [new Date(start), new Date(end)] };
      } else {
        const now = new Date();
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        where.createdAt = { [Op.between]: [startOfToday, endOfToday] };
      }

      const patients = await this.driverMasterModel.findAll({
        where,
        order: [['createdAt', 'DESC']],
      });

      return patients;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patients by date',
      );
    }
  }

  async updatePatient(
    patientId: number,
    updateData: Partial<DRIVERMASTER>,
  ): Promise<{ message: string; driver?: DRIVERMASTER; status: boolean }> {
    try {
      const existingPatient = await this.driverMasterModel.findOne({
        where: { id: patientId },
      });

      if (!existingPatient) {
        throw new NotFoundException(`Patient with ID ${patientId} not found`);
      }

      if (updateData.localAddressState) {
        updateData.localAddressState =
          updateData.localAddressState.toUpperCase();
      }

      await existingPatient.update(updateData);

      return {
        message: 'Patient updated successfully.',
        driver: existingPatient,
        status: true,
      };
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to update patient',
      );
    }
  }

  async getPatientByUHID(
    requestingUser: any,
    uhid: string,
  ): Promise<DRIVERMASTER & { lastVisitDate: Date | null }> {
    if (!uhid) {
      throw new BadRequestException('UHID is required');
    }

    try {
      const scopeWhere = buildScopeWhere(
        {
          id: requestingUser.id,
          role: requestingUser.role,
          tenant_id: requestingUser.tenantId,
          center_id: requestingUser.centerId,
        },
        this.driverMasterModel,
      );

      const where: WhereOptions = {
        ...scopeWhere,
        external_id: uhid,
      };

      const patient = await this.driverMasterModel.findOne({
        where,
      });

      if (!patient) {
        throw new NotFoundException(`Patient with UHID ${uhid} not found`);
      }

      // Get latest OPD visit
      const result = await this.sequelize.query<{
        lastVisitDate: Date | null;
      }>(
        `
        SELECT
          "AddedDate" AS "lastVisitDate"
        FROM opd_billing
        WHERE "PicasoNo" = :uhid
        ORDER BY "AddedDate" DESC
        LIMIT 1
      `,
        {
          replacements: { uhid },
          type: QueryTypes.SELECT,
        },
      );

      const lastVisitDate = result[0]?.lastVisitDate ?? null;

      return {
        ...patient.toJSON(),
        lastVisitDate,
      } as DRIVERMASTER & { lastVisitDate: Date | null };
    } catch (error: any) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patient',
      );
    }
  }

  async searchUHID(user: any, query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const scopeWhere = buildScopeWhere(
      {
        id: user.id,
        role: user.role,
        tenant_id: user.tenantId,
        center_id: user.centerId,
      },
      this.driverMasterModel,
    );

    const where: WhereOptions = {
      ...scopeWhere,

      external_id: {
        [Op.iLike]: `%${query}%`,
      },

      is_deleted: false,
    };

    return await this.driverMasterModel.findAll({
      where,
      attributes: ['external_id'],
      limit: 10,
      order: [['external_id', 'ASC']],
    });
  }
  async findByEmployeeId(employeeId: string): Promise<DRIVERMASTER> {
    try {
      const patient = await this.driverMasterModel.findOne({
        where: { employeeId, is_deleted: false },
      });

      if (!patient) {
        throw new NotFoundException(
          `Patient with Employee ID ${employeeId} not found`,
        );
      }

      return patient;
    } catch (error: any) {
      throw new InternalServerErrorException(
        error.message || 'Failed to fetch patient by employee ID',
      );
    }
  }

  async searchEmployeeId(user: any, query: string) {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const scopeWhere = buildScopeWhere(
      {
        id: user.id,
        role: user.role,
        tenant_id: user.tenantId,
        center_id: user.centerId,
      },
      this.driverMasterModel,
    );

    return await this.driverMasterModel.findAll({
      where: {
        ...scopeWhere,

        employeeId: {
          [Op.iLike]: `%${query}%`,
        },

        is_deleted: false,
      },

      attributes: ['employeeId'],

      limit: 10,

      order: [['employeeId', 'ASC']],
    });
  }
  async searchName(user: any, query: string) {
    if (!query || query.trim().length < 1) return [];

    const scopeWhere = buildScopeWhere(
      {
        id: user.id,
        role: user.role,
        tenant_id: user.tenantId,
        center_id: user.centerId,
      },
      this.driverMasterModel,
    );

    return await this.driverMasterModel.findAll({
      where: {
        ...scopeWhere,
        name: {
          [Op.iLike]: `%${query}%`,
        },
        is_deleted: false,
      },
      attributes: ['name'],
      limit: 10,
    });
  }

  async searchNameFull(user: any, query: string) {
    if (!query || query.trim().length < 1) return [];
    const scopeWhere = buildScopeWhere(
      {
        id: user.id,
        role: user.role,
        tenant_id: user.tenantId,
        center_id: user.centerId,
      },
      this.driverMasterModel,
    );
    return await this.driverMasterModel.findAll({
      where: {
        ...scopeWhere,
        name: {
          [Op.iLike]: `%${query}%`,
        },
        is_deleted: false,
      },
      attributes: ['id', 'employeeId', 'name', 'age', 'gender'],
      limit: 10,
    });
  }
  async softDeletePatient(id: number) {
    const patient = await this.driverMasterModel.findOne({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException(`Patient with ID ${id} not found`);
    }

    await patient.update({ is_deleted: true });

    return { message: 'Patient deleted successfully', status: true };
  }
  async getDueAmountByUHID(uhid: string): Promise<number> {
    if (!uhid) return 0;

    const result = await this.sequelize.query(
      `
    SELECT 
      COALESCE(SUM("TotalServiceAmount"), 0) - 
      COALESCE(SUM("PaidAmount"), 0) AS "PreviousDue"
    FROM opd_billing
    WHERE "PicasoNo" = :uhid
    `,
      {
        replacements: { uhid },
        type: QueryTypes.SELECT,
      },
    );

    const due = Number(result[0]['PreviousDue'] || 0);

    return Math.max(0, due); // optional safety
  }
  private async addDailyPatientlist(
    user: any,
    patient: DRIVERMASTER,
    patientData: any,
  ) {
    await this.picasoOpdDailyPatientListModel.create({
      PatientID: patient.id,
      PicasoNo: patient.external_id,

      DepartmentID: patientData.DepartmentID,
      Visitype: patientData.Visitype,
      ConsultantDoctorID: patientData.ConsultantDoctorID,

      TreatemntStatus: 1,
      VisitDate: new Date(),

      AddedBy: user.id,
      AddedDate: new Date(),

      HospitalID: 1,
      FinancialYearID: new Date().getFullYear(),

      IsActive: true,

      tenant_id: user.tenantId,
      center_id: user.centerId,
    });
  }
  async getPatientsTrend(requestingUser: any) {
    try {
      const replacements: any = {};

      let whereClause = `
      WHERE d."is_deleted" = false
        AND d."createdAt" >= CURRENT_DATE - INTERVAL '6 days'
        AND d."createdAt" < CURRENT_DATE + INTERVAL '1 day'
    `;

      // Tenant / Center / Staff scoping
      if (requestingUser.role !== 'LMC_ADMIN') {
        whereClause += ` AND d."tenant_id" = :tenant_id`;
        replacements.tenant_id = requestingUser.tenantId;

        if (requestingUser.role !== 'TENANT_ADMIN') {
          whereClause += ` AND d."center_id" = :center_id`;
          replacements.center_id = requestingUser.centerId;
        }

        if (requestingUser.role === 'STAFF') {
          whereClause += ` AND d."createdBy" = :userId`;
          replacements.userId = requestingUser.id;
        }
      }

      const query = `
  SELECT
    DATE(d."createdAt") AS date,

    -- Financial Category
    COUNT(*) FILTER (
      WHERE LOWER(TRIM(d."category")) = 'apl'
    ) AS "APL",

    COUNT(*) FILTER (
      WHERE LOWER(TRIM(d."category")) = 'bpl'
    ) AS "BPL",

    -- Total Patients
    COUNT(*) AS "Total",

    -- Gender
    COUNT(*) FILTER (
      WHERE LOWER(TRIM(d."gender"::text)) = 'male'
    ) AS "Male",

    COUNT(*) FILTER (
      WHERE LOWER(TRIM(d."gender"::text)) = 'female'
    ) AS "Female",

    COUNT(*) FILTER (
      WHERE d."gender" IS NULL
         OR TRIM(d."gender"::text) = ''
         OR LOWER(TRIM(d."gender"::text)) NOT IN ('male', 'female')
    ) AS "Other"

  FROM "DRIVERMASTERs" d

  ${whereClause}

  GROUP BY DATE(d."createdAt")

  ORDER BY DATE(d."createdAt") ASC;
`;

      const result = await this.driverMasterModel.sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT,
      });

      return result;
    } catch (error) {
      console.error('Error fetching patient trend:', error);

      throw new Error('Failed to fetch patient trend data');
    }
  }
}
