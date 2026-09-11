import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Order, QueryTypes, WhereOptions } from 'sequelize';
import { Response } from 'express';
import { Parser } from 'json2csv';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { CenterGroup } from 'src/models/CenterGroup';
import { parseCenterId } from 'src/utils/parse-center-id.util';
import { resolveOperationalWindow } from 'src/utils/operational-day.util';
import {
  parseDateOfBirth,
  resolvePatientAge,
} from 'src/utils/patient-age.util';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const IST_TIMEZONE = 'Asia/Kolkata';

interface SearchDriverPayload {
  search?: string;
  external_id?: string;
  employeeId?: string;
  name?: string;
  healthCardNumber?: string;
  abhaNumber?: string;
  contactNumber?: string;
  idProof_number?: string;
  driverId?: string;
  center_id?: string | number;
  isCommingFromAdmin?: boolean;
  date?: string;
  start_date?: string;
  end_date?: string;
  page?: number | string;
  limit?: number | string;
}

interface PaginatedDriverSearchData {
  drivers: DRIVERMASTER[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchInfo: {
    search: string | null;
    filters: Record<string, string | null>;
  };
}

export interface DriverSearchResponse {
  status: boolean;
  message: string;
  data: PaginatedDriverSearchData;
}

interface DriverSearchFilters {
  search?: string;
  external_id?: string;
  employeeId?: string;
  name?: string;
  healthCardNumber?: string;
  abhaNumber?: string;
  contactNumber?: string;
  idProof_number?: string;
  driverId?: string;
  centerId: number | null;
}

interface CenterGroupInfo {
  isInGroup: boolean;
  groupName: string | null;
  centerIds: number[];
}

interface TargetCenterInfo {
  targetCenterIds: number[];
  isGroupSearch: boolean;
  isAllCentersSearch: boolean;
  requestedCenter: number | null;
  groupInfo: CenterGroupInfo | null;
}

interface CenterGroupingResult extends TargetCenterInfo {
  orderClause: Order;
  centerField: string;
}
type SearchableFields =
  | 'external_id'
  | 'employeeId'
  | 'name'
  | 'contactNumber'
  | 'abhaNumber'
  | 'healthCardNumber'
  | 'idProof_number'
  | 'driverId';

interface UniquePatientExportRow {
  centre_name: string | null;
  registration_at: Date | string | null;
  workforce_name: string | null;
  health_card_number: string | null;
  date_of_birth_or_age: string | null;
  stored_age: number | null;
  gender: string | null;
  blood_group: string | null;
  contact_number: string | null;
  emergency_contact_number: string | null;
  id_proof: string | null;
  idProof_name: string | null;
  id_proof_number: string | null;
  local_address: string | null;
  district: string | null;
  state: string | null;
  consent_form: string | null;
}

@Injectable()
export class SearchService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(DRIVERMASTER)
    private readonly driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(CenterGroup)
    private readonly centerGroupModel: typeof CenterGroup,
  ) {}

  /**
   * Search driver records with optional filters and center grouping.
   */

  async searchDriver(body: SearchDriverPayload): Promise<DriverSearchResponse> {
    try {
      let whereCondition: WhereOptions = {};
      let orderClause: Order = [['createdAt', 'DESC']];
      const hasAnySearchFilter = Boolean(
        body?.search?.trim() ||
          body?.external_id?.trim() ||
          body?.employeeId?.trim() ||
          body?.name?.trim() ||
          body?.healthCardNumber?.trim() ||
          body?.abhaNumber?.trim() ||
          body?.contactNumber?.trim() ||
          body?.idProof_number?.trim() ||
          body?.driverId?.trim(),
      );

      // Default page size: Admin historically used 100 when page/limit omitted.
      // Center and Admin UIs that send page/limit use those values instead.
      const defaultLimit = body?.isCommingFromAdmin ? 100 : 10;
      const page = Math.max(Number(body?.page) || 1, 1);
      const limit = Math.min(
        Math.max(Number(body?.limit) || defaultLimit, 1),
        100,
      );
      const offset = (page - 1) * limit;

      /* ---------------------- ADMIN FLOW ---------------------- */
      if (body?.isCommingFromAdmin) {
        if (body.center_id === undefined || body.center_id === null || body.center_id === '') {
          throw new BadRequestException(
            'center_id is required for admin search',
          );
        }
        const { centerIds } = parseCenterId(body.center_id, { required: true });
        whereCondition = {
          ...whereCondition,
          createdBy:
            centerIds.length === 1
              ? centerIds[0]
              : { [Op.in]: centerIds },
        };

        /* ---------- Date Filter (Safe) ---------- */
        if (body.start_date && body.end_date) {
          const start = new Date(body.start_date);
          start.setHours(0, 0, 0, 0);

          const end = new Date(body.end_date);
          end.setHours(23, 59, 59, 999);

          whereCondition.createdAt = {
            [Op.between]: [start, end],
          };
        }

        /* ---------- LIKE Filters (Reusable) ---------- */
        const likeFilters: SearchableFields[] = [
          'external_id',
          'employeeId',
          'name',
          'contactNumber',
          'abhaNumber',
          'healthCardNumber',
          'idProof_number',
          'driverId',
        ];

        likeFilters.forEach((key) => {
          const value = body[key]?.trim();

          if (value) {
            whereCondition[key] = {
              [Op.iLike]: `%${value}%`,
            };
          }
        });
      } else {

      /* ---------------------- NORMAL FLOW ---------------------- */
        const parsedCenter = parseCenterId(body.center_id);
        const filters = this.buildSearchFilters(body);
        if (parsedCenter.isMultiCenter) {
          whereCondition = this.buildDriverWhereForExplicitCenters(
            parsedCenter.centerIds,
            filters,
          );
          orderClause = [['createdAt', 'DESC']];
        } else {
          const groupingInfo = await this.processCenterGrouping(filters.centerId);
          whereCondition = this.buildDriverWhere(groupingInfo, filters);
          orderClause = groupingInfo.orderClause;
        }
      }

      /* ---------------------- QUERY ---------------------- */
      const queryOptions = {
        where: whereCondition,
        order: orderClause,
        limit,
        offset,
      };

      const { rows: drivers, count } =
        await this.driverMasterModel.findAndCountAll(queryOptions);

      return {
        status: drivers.length > 0,
        message:
          drivers.length > 0
            ? 'Drivers fetched successfully'
            : hasAnySearchFilter
              ? 'No matching driver found'
              : 'No drivers found',
        data: {
          drivers,
          pagination: {
            page,
            limit,
            total: count,
            totalPages: Math.ceil(count / limit) || 1,
          },
          searchInfo: {
            search: body?.search?.trim() || null,
            filters: {
              external_id: body?.external_id?.trim() || null,
              employeeId: body?.employeeId?.trim() || null,
              name: body?.name?.trim() || null,
              healthCardNumber: body?.healthCardNumber?.trim() || null,
              abhaNumber: body?.abhaNumber?.trim() || null,
              contactNumber: body?.contactNumber?.trim() || null,
              idProof_number: body?.idProof_number?.trim() || null,
              driverId: body?.driverId?.trim() || null,
            },
          },
        },
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      const message =
        error instanceof Error ? error.message : 'Internal server error';
      throw new InternalServerErrorException(message);
    }
  }

  /**
   * Admin-only CSV export of unique patients from Patient Management filters.
   * Uses the same DRIVERMASTER centre/column filters as search; date uses
   * operational day (06:00–05:59 IST) when a range is selected.
   */
  async exportUniquePatientsCsv(
    body: SearchDriverPayload,
    res: Response,
  ): Promise<void> {
    if (!body?.isCommingFromAdmin) {
      throw new BadRequestException('This export is available for admin only');
    }
    if (
      body.center_id === undefined ||
      body.center_id === null ||
      body.center_id === ''
    ) {
      throw new BadRequestException(
        'center_id is required for unique patients export',
      );
    }

    const { centerIds } = parseCenterId(body.center_id, { required: true });

    const driverFilterClauses: string[] = [];
    const replacements: Record<string, unknown> = {
      centerIds,
    };

    if (body.start_date && body.end_date) {
      const window = resolveOperationalWindow(body.start_date, body.end_date);
      driverFilterClauses.push(
        `d."createdAt" BETWEEN :windowStart AND :windowEnd`,
      );
      replacements.windowStart = window.startUtc;
      replacements.windowEnd = window.endUtc;
    }

    const likeFilters: { key: SearchableFields; column: string }[] = [
      { key: 'external_id', column: 'external_id' },
      { key: 'employeeId', column: 'employee_id' },
      { key: 'name', column: 'name' },
      { key: 'contactNumber', column: 'contactNumber' },
      { key: 'abhaNumber', column: 'abhaNumber' },
      { key: 'healthCardNumber', column: 'healthCardNumber' },
      { key: 'idProof_number', column: 'idProof_number' },
      { key: 'driverId', column: 'driverId' },
    ];

    likeFilters.forEach(({ key, column }) => {
      const value = body[key]?.trim();
      if (value) {
        const paramKey = `filter_${key}`;
        driverFilterClauses.push(`d."${column}" ILIKE :${paramKey}`);
        replacements[paramKey] = `%${value}%`;
      }
    });

    const driverFilterSql = driverFilterClauses.length
      ? `AND ${driverFilterClauses.join(' AND ')}`
      : '';

    const rows = await this.sequelize.query<UniquePatientExportRow>(
      `
      SELECT
        center.project_name AS centre_name,
        d."createdAt" AS registration_at,
        d.name AS workforce_name,
        d."healthCardNumber" AS health_card_number,
        d."dateOfBirthOrAge" AS date_of_birth_or_age,
        d.age AS stored_age,
        d.gender,
        d.blood_group,
        d."contactNumber" AS contact_number,
        d."emergencyContactNumber" AS emergency_contact_number,
        d."idProof" AS id_proof,
        d."idProof_name" AS idProof_name,
        d."idProof_number" AS id_proof_number,
        d."localAddress" AS local_address,
        d."localAddressDistrict" AS district,
        d."localAddressState" AS state,
        d.consent_form
      FROM "DRIVERMASTERs" d
      LEFT JOIN "Centers" center ON center.id = d."createdBy"
      WHERE d."createdBy" IN (:centerIds)
        ${driverFilterSql}
      ORDER BY d."createdAt" DESC
      `,
      {
        replacements,
        type: QueryTypes.SELECT,
      },
    );

    if (!rows.length) {
      throw new NotFoundException(
        'No patients found for the selected filters',
      );
    }

    const csvRows = rows.map((row) => this.mapUniquePatientExportRow(row));
    const parser = new Parser({
      fields: [
        { label: 'CENTRE NAME', value: 'centreName' },
        { label: 'DATE OF REGISTRATION', value: 'dateOfRegistration' },
        { label: 'WORKFORCE NAME', value: 'workforceName' },
        { label: 'HEALTH CARD NUMBER', value: 'healthCardNumber' },
        { label: 'DATE OF BIRTH', value: 'dateOfBirth' },
        { label: 'AGE', value: 'age' },
        { label: 'GENDER', value: 'gender' },
        { label: 'BLOOD GROUP', value: 'bloodGroup' },
        { label: 'CONTACT NUMBER', value: 'contactNumber' },
        { label: 'EMERGENCY CONTACT NUMBER', value: 'emergencyContactNumber' },
        { label: 'ID PROOF NAME', value: 'idProofName' },
        { label: 'ID PROOF NUMBER', value: 'idProofNumber' },
        { label: 'LOCAL ADDRESS', value: 'localAddress' },
        { label: 'DISTRICT', value: 'district' },
        { label: 'STATE', value: 'state' },
        { label: 'CONSENT FORM LINK', value: 'consentFormLink' },
      ],
    });

    const csv = parser.parse(csvRows);
    const exportDate = dayjs().tz(IST_TIMEZONE).format('YYYY-MM-DD');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=unique-patients-${exportDate}.csv`,
    );
    res.send(csv);
  }

  private formatIdProofName(
    idProof?: string | null,
    otherIdName?: string | null,
  ): string {
    const type = idProof?.trim().toLowerCase();
    if (type === 'aadhar_card' || type === 'aadhaar_card' || type === 'aadhar') {
      return 'Aadhar Card';
    }
    if (type === 'driving_licence' || type === 'driving_license') {
      return 'Driving License';
    }
    if (type === 'voter_id') {
      return 'Voter ID';
    }
    if (type === 'other_id') {
      return otherIdName?.trim() || 'Other ID';
    }
    if (otherIdName?.trim()) {
      return otherIdName.trim();
    }
    if (!idProof?.trim()) {
      return '';
    }
    return idProof
      .trim()
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  private mapUniquePatientExportRow(row: UniquePatientExportRow) {
    const dob = parseDateOfBirth(row.date_of_birth_or_age ?? '');
    const dateOfBirth = dob
      ? dayjs(dob).tz(IST_TIMEZONE).format('YYYY-MM-DD')
      : /^\d{1,3}$/.test(row.date_of_birth_or_age ?? '')
        ? ''
        : row.date_of_birth_or_age ?? '';
    const age =
      row.stored_age != null && row.stored_age > 0
        ? String(row.stored_age)
        : resolvePatientAge({
            age: row.stored_age,
            dateOfBirthOrAge: row.date_of_birth_or_age,
          });

    return {
      centreName: row.centre_name ?? '',
      dateOfRegistration: row.registration_at
        ? dayjs(row.registration_at)
            .tz(IST_TIMEZONE)
            .format('YYYY-MM-DD HH:mm:ss')
        : '',
      workforceName: row.workforce_name ?? '',
      healthCardNumber: row.health_card_number ?? '',
      dateOfBirth,
      age: age === '-' ? '' : age,
      gender: row.gender ?? '',
      bloodGroup: row.blood_group ?? '',
      contactNumber: row.contact_number ?? '',
      emergencyContactNumber: row.emergency_contact_number ?? '',
      idProofName: this.formatIdProofName(row.id_proof, row.idProof_name),
      idProofNumber: row.id_proof_number ?? '',
      localAddress: row.local_address ?? '',
      district: row.district ?? '',
      state: row.state ?? '',
      consentFormLink: row.consent_form ?? '',
    };
  }

  private buildSearchFilters(body: SearchDriverPayload): DriverSearchFilters {
    const parsedCenter = parseCenterId(body.center_id);
    const centerId =
      parsedCenter.centerIds.length === 1 ? parsedCenter.centerIds[0] : null;
    return {
      search: body.search,
      external_id: body.external_id,
      employeeId: body.employeeId,
      name: body.name,
      healthCardNumber: body.healthCardNumber,
      abhaNumber: body.abhaNumber,
      contactNumber: body.contactNumber,
      idProof_number: body.idProof_number,
      driverId: body.driverId,
      centerId,
    };
  }

  private buildDriverWhere(
    groupingInfo: CenterGroupingResult,
    filters: DriverSearchFilters,
  ): WhereOptions<DRIVERMASTER> {
    const andConditions: WhereOptions<DRIVERMASTER>[] = [];
    if (groupingInfo.targetCenterIds.length > 0) {
      andConditions.push({
        createdBy: { [Op.in]: groupingInfo.targetCenterIds },
      });
    }
    const genericSearchCondition = this.buildGenericSearchCondition(filters.search);
    if (genericSearchCondition) {
      andConditions.push(genericSearchCondition);
    }
    if (filters.external_id) {
      andConditions.push({
        external_id: { [Op.iLike]: `%${filters.external_id}%` },
      });
    }
    if (filters.employeeId) {
      andConditions.push({
        employeeId: { [Op.iLike]: `%${filters.employeeId}%` },
      });
    }
    if (filters.name) {
      andConditions.push({
        name: { [Op.iLike]: `%${filters.name}%` },
      });
    }
    if (filters.healthCardNumber) {
      andConditions.push({
        healthCardNumber: { [Op.iLike]: `%${filters.healthCardNumber}%` },
      });
    }
    if (filters.abhaNumber) {
      andConditions.push({
        abhaNumber: { [Op.iLike]: `%${filters.abhaNumber}%` },
      });
    }
    if (filters.contactNumber) {
      andConditions.push({
        contactNumber: { [Op.iLike]: `%${filters.contactNumber}%` },
      });
    }
    if (filters.idProof_number) {
      andConditions.push({
        idProof_number: { [Op.iLike]: `%${filters.idProof_number}%` },
      });
    }
    if (filters.driverId) {
      andConditions.push({
        driverId: { [Op.iLike]: `%${filters.driverId}%` },
      });
    }
    return andConditions.length > 0
      ? ({ [Op.and]: andConditions } as WhereOptions<DRIVERMASTER>)
      : {};
  }

  private buildDriverWhereForExplicitCenters(
    centerIds: number[],
    filters: DriverSearchFilters,
  ): WhereOptions<DRIVERMASTER> {
    const andConditions: WhereOptions<DRIVERMASTER>[] = [
      { createdBy: { [Op.in]: centerIds } },
    ];
    const genericSearchCondition = this.buildGenericSearchCondition(filters.search);
    if (genericSearchCondition) {
      andConditions.push(genericSearchCondition);
    }
    if (filters.external_id) {
      andConditions.push({
        external_id: { [Op.iLike]: `%${filters.external_id}%` },
      });
    }
    if (filters.employeeId) {
      andConditions.push({
        employeeId: { [Op.iLike]: `%${filters.employeeId}%` },
      });
    }
    if (filters.name) {
      andConditions.push({
        name: { [Op.iLike]: `%${filters.name}%` },
      });
    }
    if (filters.healthCardNumber) {
      andConditions.push({
        healthCardNumber: { [Op.iLike]: `%${filters.healthCardNumber}%` },
      });
    }
    if (filters.abhaNumber) {
      andConditions.push({
        abhaNumber: { [Op.iLike]: `%${filters.abhaNumber}%` },
      });
    }
    if (filters.contactNumber) {
      andConditions.push({
        contactNumber: { [Op.iLike]: `%${filters.contactNumber}%` },
      });
    }
    if (filters.idProof_number) {
      andConditions.push({
        idProof_number: { [Op.iLike]: `%${filters.idProof_number}%` },
      });
    }
    if (filters.driverId) {
      andConditions.push({
        driverId: { [Op.iLike]: `%${filters.driverId}%` },
      });
    }
    return { [Op.and]: andConditions } as WhereOptions<DRIVERMASTER>;
  }

  private buildGenericSearchCondition(
    search?: string,
  ): WhereOptions<DRIVERMASTER> | null {
    const normalizedSearch = search?.trim();
    if (!normalizedSearch) {
      return null;
    }

    const likeSearch = `%${normalizedSearch}%`;
    const orConditions: WhereOptions<DRIVERMASTER>[] = [
      { external_id: { [Op.iLike]: likeSearch } },
      { employeeId: { [Op.iLike]: likeSearch } },
      { name: { [Op.iLike]: likeSearch } },
      { contactNumber: { [Op.iLike]: likeSearch } },
      { abhaNumber: { [Op.iLike]: likeSearch } },
      { healthCardNumber: { [Op.iLike]: likeSearch } },
      { idProof_number: { [Op.iLike]: likeSearch } },
      { driverId: { [Op.iLike]: likeSearch } },
    ];

    if (/^\d+$/.test(normalizedSearch)) {
      orConditions.push({
        id: Number(normalizedSearch),
      } as WhereOptions<DRIVERMASTER>);
    }

    return {
      [Op.or]: orConditions,
    } as WhereOptions<DRIVERMASTER>;
  }

  private async processCenterGrouping(
    centerId: number | null,
  ): Promise<CenterGroupingResult> {
    const defaultOrder: Order = [['createdAt', 'DESC']];
    const groupingOptions = {
      centerField: 'createdBy',
      defaultOrder,
      tableAlias: '',
    };
    const targetInfo = await this.resolveTargetCenters(centerId);
    const orderClause = this.generateSortingOrder(
      targetInfo.targetCenterIds,
      groupingOptions.centerField,
      groupingOptions.defaultOrder,
      groupingOptions.tableAlias,
    );
    return {
      ...targetInfo,
      orderClause,
      centerField: groupingOptions.centerField,
    };
  }

  private async resolveTargetCenters(
    centerId: number | null,
  ): Promise<TargetCenterInfo> {
    if (!centerId) {
      return {
        targetCenterIds: [],
        isGroupSearch: false,
        isAllCentersSearch: true,
        requestedCenter: null,
        groupInfo: null,
      };
    }
    const groupInfo = await this.findCenterGroup(centerId);
    if (groupInfo.isInGroup) {
      return {
        targetCenterIds: groupInfo.centerIds,
        isGroupSearch: true,
        isAllCentersSearch: false,
        requestedCenter: centerId,
        groupInfo,
      };
    }
    return {
      targetCenterIds: [],
      isGroupSearch: false,
      isAllCentersSearch: true,
      requestedCenter: centerId,
      groupInfo: null,
    };
  }

  private async findCenterGroup(centerId: number): Promise<CenterGroupInfo> {
    const centerIdStr = String(centerId);
    const group = await this.centerGroupModel.findOne({
      where: {
        is_active: true,
        [Op.or]: [
          { center_ids: { [Op.contains]: [centerId] } },
          { center_ids: { [Op.contains]: [centerIdStr] } },
        ],
      },
    });
    if (!group) {
      return { isInGroup: false, groupName: null, centerIds: [] };
    }
    const centerIds = (group.center_ids ?? [])
      .map((value) => Number(value))
      .filter((value): value is number => Number.isFinite(value));
    return { isInGroup: true, groupName: group.group_name, centerIds };
  }

  private generateSortingOrder(
    targetCenterIds: number[],
    centerField: string,
    defaultOrder: Order,
    tableAlias = '',
  ): Order {
    if (targetCenterIds.length === 0) {
      return defaultOrder;
    }
    const qualifiedField = tableAlias
      ? `"${tableAlias}"."${centerField}"`
      : `"${centerField}"`;
    const caseStatement = targetCenterIds
      .map((id) => `${qualifiedField} = ${id}`)
      .join(' OR ');
    const literalExpression = this.sequelize.literal(
      `CASE WHEN (${caseStatement}) THEN 1 ELSE 0 END`,
    );
    return [
      [literalExpression, 'DESC'],
      ['createdAt', 'DESC'],
    ];
  }
}
