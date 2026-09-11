import { Injectable, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { ShiftSummaryRequestDto } from './dto/shift-summary-request.dto';
import { ShiftSummaryResponse } from './types/shift-summary-response.type';
import {
  getOperationalDateRangeWindow,
  getOperationalDayWindow,
} from '../../utils/operational-day.util';
import {
    buildEmptyShiftSummary,
    foldShiftAggregationRows,
    ShiftAggregationRow,
} from './utils/shift-summary.util';
import { parseCenterId } from '../../utils/parse-center-id.util';
import {
    emptyShapedContacts,
    mergeContactsIntoCetObjects,
} from 'src/helper/cet-contact.helper';
import {
    buildHealthCheckupListFilters,
    buildPaginationMeta,
    HEALTH_CHECKUP_CENTER_JSON,
    HEALTH_CHECKUP_CET_JSON,
    HEALTH_CHECKUP_DRIVER_JSON,
    HEALTH_CHECKUP_LIST_JOINS,
    HealthCheckupListQueryParams,
    parseHealthCheckupListParams,
    PENDING_CONCERN_LATERAL_JOIN,
} from '../../utils/health-checkup-list.util';

const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);


@Injectable()
export class HealthService {
    constructor(private readonly sequelize: Sequelize) { }

    async viewHealthData(body: HealthCheckupListQueryParams) {
        try {
            const { page, limit, offset, listMode, filters } =
                parseHealthCheckupListParams(body);

            const center_id = filters.center_id;
            let centerIds: number[] = [];
            if (center_id !== undefined && center_id !== null) {
                ({ centerIds } = parseCenterId(center_id, { required: true }));
            }

            const filterContext = buildHealthCheckupListFilters(filters, centerIds);
            const whereClauses = [...filterContext.whereClauses];
            const replacements = { ...filterContext.replacements };

            const whereSql = whereClauses.length
                ? `WHERE ${whereClauses.join(' AND ')}`
                : '';

            if (listMode === 'pending_concerns') {
                return await this.fetchPendingConcernsList(
                    whereSql,
                    replacements,
                    page,
                    limit,
                    offset,
                );
            }

            return await this.fetchCheckupList(
                whereSql,
                replacements,
                page,
                limit,
                offset,
            );
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }

            throw new InternalServerErrorException('Internal server error');
        }
    }

    private async fetchCheckupList(
        whereSql: string,
        replacements: Record<string, unknown>,
        page: number,
        limit: number,
        offset: number,
    ) {
        const countQuery = `
            SELECT COUNT(*)::int AS total
            ${HEALTH_CHECKUP_LIST_JOINS}
            ${whereSql};
        `;

        const countRows = await this.sequelize.query<{ total: number }>(countQuery, {
            replacements,
            type: QueryTypes.SELECT,
        });
        const total = countRows[0]?.total ?? 0;

        const query = `
            SELECT
            dhc.*,
            ${HEALTH_CHECKUP_DRIVER_JSON},
            ${HEALTH_CHECKUP_CET_JSON},
            ${HEALTH_CHECKUP_CENTER_JSON}
            ${HEALTH_CHECKUP_LIST_JOINS}
            ${whereSql}
            ORDER BY dhc."createdAt" DESC
            LIMIT :limit OFFSET :offset;
        `;

        const results = await this.sequelize.query(query, {
            replacements: { ...replacements, limit, offset },
            type: QueryTypes.SELECT,
        });

        const responseData = await this.mergeCetContactsIntoRows(
            results as Array<{
                CETMANAGEMENT?: Record<string, unknown> | null;
                [key: string]: unknown;
            }>,
        );

        return {
            status: true,
            message: 'List of driver health checkup',
            data: {
                records: responseData,
                pagination: buildPaginationMeta(page, limit, total),
            },
        };
    }

    private async fetchPendingConcernsList(
        whereSql: string,
        replacements: Record<string, unknown>,
        page: number,
        limit: number,
        offset: number,
    ) {
        const baseWhere = whereSql
            ? `${whereSql}`
            : '';
        const joinsWithConcerns = `${HEALTH_CHECKUP_LIST_JOINS}
            ${PENDING_CONCERN_LATERAL_JOIN}`;

        const countQuery = `
            SELECT COUNT(*)::int AS total
            ${joinsWithConcerns}
            ${baseWhere};
        `;

        const countRows = await this.sequelize.query<{ total: number }>(countQuery, {
            replacements,
            type: QueryTypes.SELECT,
        });
        const total = countRows[0]?.total ?? 0;

        const query = `
            SELECT
            dhc.*,
            concerns_expanded.concern_elem AS "concern",
            ${HEALTH_CHECKUP_DRIVER_JSON},
            ${HEALTH_CHECKUP_CET_JSON},
            ${HEALTH_CHECKUP_CENTER_JSON}
            ${joinsWithConcerns}
            ${baseWhere}
            ORDER BY dhc."createdAt" DESC, concerns_expanded.concern_elem->>'id' DESC NULLS LAST
            LIMIT :limit OFFSET :offset;
        `;

        const results = await this.sequelize.query(query, {
            replacements: { ...replacements, limit, offset },
            type: QueryTypes.SELECT,
        });

        const mergedRows = await this.mergeCetContactsIntoRows(
            results as Array<{
                CETMANAGEMENT?: Record<string, unknown> | null;
                [key: string]: unknown;
            }>,
        );

        const records = mergedRows.map((row) => {
            const typedRow = row as Record<string, unknown>;
            const concern = typedRow.concern as Record<string, unknown> | null;
            const cet = typedRow.CETMANAGEMENT as Record<string, unknown> | null;
            const center = typedRow.center as Record<string, unknown> | null;
            const driver = typedRow.driver as Record<string, unknown> | null;
            const centerId =
                typedRow.createdBy ?? center?.id ?? cet?.center_id ?? 0;
            const centerProjectName =
                center?.project_name ?? center?.name ?? cet?.name ?? '';

            return {
                id:
                    typeof concern?.id === 'string' && concern.id.length > 0
                        ? concern.id
                        : `${typedRow.id}-${concern?.parameter ?? 'concern'}`,
                health_checkup_id: typedRow.id as number,
                driver_id: typedRow.driver_id as number,
                cet_id: cet?.id ?? 0,
                center_id: centerId,
                concern_type: concern?.type ?? '',
                concern_level: concern?.level ?? '',
                parameter_value: {
                    parameter: concern?.parameter ?? '',
                    value: String(concern?.value ?? ''),
                    unit: '',
                },
                threshold_value: {
                    threshold: String(concern?.threshold ?? ''),
                    recommendation: concern?.recommendation ?? '',
                },
                spoc_details: {
                    cet: {
                        name:
                            cet?.spocName ||
                            cet?.alternateSpocName ||
                            cet?.name ||
                            '',
                        email: cet?.spocEmail ?? '',
                        whatsapp:
                            cet?.spocWhatsappNumber ||
                            cet?.contactNumber ||
                            cet?.alternateSpocContactNumber ||
                            '',
                    },
                    client: {
                        name: cet?.client_spoc_name ?? '',
                        email: cet?.client_spoc_email ?? '',
                        whatsapp: cet?.client_spoc_whatsapp ?? '',
                    },
                },
                status: 'PENDING',
                createdAt: typedRow.createdAt,
                updatedAt: typedRow.updatedAt,
                driver: {
                    id: driver?.id ?? 0,
                    name: driver?.name ?? '',
                    contactNumber: driver?.contactNumber ?? '',
                    vehicleNo:
                        (typedRow.vehicle_no as string | undefined) ??
                        (driver?.vehicle_no as string | undefined) ??
                        '',
                    dlNo:
                        String(driver?.idProof || '').toLowerCase() ===
                            'driving_licence' ||
                        String(driver?.idProof || '').toLowerCase() ===
                            'driving license'
                            ? driver?.idProof_number ?? ''
                            : '',
                },
                cet: {
                    id: cet?.id ?? 0,
                    name: cet?.name ?? '',
                    spocName: cet?.spocName ?? '',
                    spocEmail: cet?.spocEmail ?? '',
                    spocWhatsappNumber: cet?.spocWhatsappNumber ?? '',
                    alternateSpocName: cet?.alternateSpocName,
                    alternateSpocContactNumber: cet?.alternateSpocContactNumber,
                    contactNumber: cet?.contactNumber,
                    manager: cet?.manager ?? null,
                    supervisors: Array.isArray(cet?.supervisors)
                        ? cet.supervisors
                        : [],
                },
                center: {
                    id: centerId,
                    project_name: centerProjectName,
                    client_spoc_name: cet?.client_spoc_name ?? null,
                    client_spoc_email: cet?.client_spoc_email ?? null,
                    client_spoc_whatsapp: cet?.client_spoc_whatsapp ?? null,
                },
            };
        });

        return {
            status: true,
            message: 'List of pending health concerns',
            data: {
                records,
                pagination: buildPaginationMeta(page, limit, total),
            },
        };
    }

    private async mergeCetContactsIntoRows(
        typedResults: Array<{
            CETMANAGEMENT?: Record<string, unknown> | null;
            [key: string]: unknown;
        }>,
    ) {
        const mergedCets = await mergeContactsIntoCetObjects(
            typedResults.map((row) => row.CETMANAGEMENT || null),
        );

        return typedResults.map((row, index) => ({
            ...row,
            CETMANAGEMENT: mergedCets[index]
                ? {
                    ...emptyShapedContacts(),
                    ...mergedCets[index],
                }
                : row.CETMANAGEMENT,
        }));
    }

    /**
     * Returns shift-wise service counts for a centre.
     * Default: one operational day. With startDate/endDate: same createdAt window as list filter
     * (startDate 06:00 IST → endDate 05:59 IST).
     * Only Ready reports are counted.
     * Shift A/B/C is derived from date_time (entry/checkup time), not report_confirmed_at.
     */
    async getShiftSummary(
        body: ShiftSummaryRequestDto,
    ): Promise<ShiftSummaryResponse> {
        try {
            const { center_id, operational_date, startDate, endDate } = body;
            const { centerIds, normalizedInput } = parseCenterId(center_id, {
                required: true,
            });

            const hasRange = Boolean(startDate && endDate);
            if (hasRange) {
                if (endDate < startDate) {
                    throw new BadRequestException(
                        'End date should be after start date',
                    );
                }
            } else if (!operational_date) {
                throw new BadRequestException(
                    'operational_date or startDate/endDate is required',
                );
            }

            const window = hasRange
                ? getOperationalDateRangeWindow(startDate, endDate)
                : getOperationalDayWindow(operational_date);
            const summaryDateLabel = hasRange
                ? `${startDate}_${endDate}`
                : operational_date;
            const emptySummary = buildEmptyShiftSummary(
                summaryDateLabel,
                normalizedInput,
                window,
            );
            const query = `
        WITH classified AS (
          SELECT
            dhc.id,
            CASE
              WHEN EXTRACT(
                HOUR FROM timezone('Asia/Kolkata', CAST(dhc.date_time AS timestamptz))
              ) BETWEEN 6 AND 13 THEN 'A'
              WHEN EXTRACT(
                HOUR FROM timezone('Asia/Kolkata', CAST(dhc.date_time AS timestamptz))
              ) BETWEEN 14 AND 21 THEN 'B'
              ELSE 'C'
            END AS shift,
            CASE
              WHEN EXISTS (
                SELECT 1 FROM unnest(dhc.selected_package_name) p
                WHERE UPPER(p) LIKE '%COUNSELLING%'
              ) THEN 'counselling'
              WHEN EXISTS (
                SELECT 1 FROM unnest(dhc.selected_package_name) p
                WHERE UPPER(p) LIKE '%BASIC%'
              ) THEN 'basic'
              WHEN EXISTS (
                SELECT 1 FROM unnest(dhc.selected_package_name) p
                WHERE UPPER(p) LIKE '%ADVANCED%'
              ) THEN 'advance'
              ELSE NULL
            END AS service_type
          FROM "driverhealthcheckups" dhc
          WHERE dhc."createdBy" IN (:center_ids)
            AND dhc.is_submited = true
            AND LOWER(TRIM(dhc.confirm_report)) = 'yes'
            AND dhc.report_confirmed_at IS NOT NULL
            AND dhc.date_time IS NOT NULL
            AND dhc."createdAt" BETWEEN :windowStart AND :windowEnd
        )
        SELECT
          shift,
          service_type,
          COUNT(*)::int AS count,
          ARRAY_AGG(id ORDER BY id DESC)::int[] AS record_ids
        FROM classified
        WHERE service_type IS NOT NULL
        GROUP BY shift, service_type;
      `;
            const rows = await this.sequelize.query<ShiftAggregationRow>(query, {
                replacements: {
                    center_ids: centerIds,
                    windowStart: window.startUtc,
                    windowEnd: window.endUtc,
                },
                type: QueryTypes.SELECT,
            });
            const data = foldShiftAggregationRows(emptySummary, rows);
            return {
                status: true,
                message: 'Shift-wise health checkup summary',
                data,
            };
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            console.error('[SHIFT_SUMMARY]', error);
            throw new InternalServerErrorException('Internal server error');
        }
    }
}
