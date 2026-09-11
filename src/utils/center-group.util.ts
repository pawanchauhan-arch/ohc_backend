/**
 * Center Group Utility
 *
 * Centralized management of center groups with caching,
 * filtering, and sorting helpers for Sequelize queries.
 */

import { Op, literal } from 'sequelize';
import { CenterGroup } from 'src/models/CenterGroup';

/* ===================== TYPES ===================== */

export interface CenterGroupInfo {
  groupName: string | null;
  centerIds: string[];
  isInGroup: boolean;
}

export interface ResolveTargetCentersResult {
  targetCenterIds: string[];
  isGroupSearch: boolean;
  isAllCentersSearch: boolean;
  requestedCenter: number | null;
  groupInfo: CenterGroupInfo | null;
}

export interface ProcessCenterGroupingOptions {
  centerField?: string;
  defaultOrder?: any[];
  tableAlias?: string;
}

/* ===================== CACHE ===================== */

let centerGroupsCache: Record<string, string[]> | null = null;
let cacheTimestamp: number | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/* ===================== INTERNAL ===================== */

const loadCenterGroupsFromDB = async (): Promise<Record<string, string[]>> => {
  try {
    const groups = await CenterGroup.findAll({
      where: { is_active: true },
      attributes: ['id', 'group_name', 'center_ids'],
      order: [['created_at', 'ASC']],
      raw: true,
    });

    const centerGroups: Record<any, any[]> = {};

    groups.forEach((group, index) => {
      centerGroups[`group${index + 1}`] = group.center_ids ?? [];
    });

    return centerGroups;
  } catch (error) {
    console.error('Error loading center groups from database:', error);
    return {};
  }
};

const getCenterGroupsFromDBInternal = async () => {
  const now = Date.now();

  if (
    centerGroupsCache &&
    cacheTimestamp &&
    now - cacheTimestamp < CACHE_DURATION
  ) {
    return centerGroupsCache;
  }

  centerGroupsCache = await loadCenterGroupsFromDB();
  cacheTimestamp = now;

  return centerGroupsCache;
};

/* ===================== PUBLIC API ===================== */

export const clearCenterGroupsCache = (): void => {
  centerGroupsCache = null;
  cacheTimestamp = null;
};

export const getCenterGroups = async (): Promise<Record<string, string[]>> => {
  return getCenterGroupsFromDBInternal();
};

export const findCenterGroup = async (
  centerId: number | string,
): Promise<CenterGroupInfo> => {
  try {
    const centerGroups = await getCenterGroupsFromDBInternal();
    const centerIdStr = String(centerId);

    for (const [groupName, centerIds] of Object.entries(centerGroups)) {
      if (centerIds.includes(centerIdStr)) {
        return {
          groupName,
          centerIds,
          isInGroup: true,
        };
      }
    }

    return {
      groupName: null,
      centerIds: [],
      isInGroup: false,
    };
  } catch (error) {
    console.error('Error finding center group:', error);
    return {
      groupName: null,
      centerIds: [],
      isInGroup: false,
    };
  }
};

export const resolveTargetCenters = async (
  centerId: number | null,
): Promise<ResolveTargetCentersResult> => {
  if (!centerId) {
    return {
      targetCenterIds: [],
      isGroupSearch: false,
      isAllCentersSearch: true,
      requestedCenter: null,
      groupInfo: null,
    };
  }

  const groupInfo = await findCenterGroup(centerId);

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
};

/* ===================== QUERY HELPERS ===================== */

export const generateSortingOrder = (
  targetCenterIds: (string | number)[],
  centerField = 'createdBy',
  defaultOrder: any[] = [['createdAt', 'DESC']],
  tableAlias = '',
): any[] => {
  if (!targetCenterIds.length) {
    return defaultOrder;
  }

  const qualifiedField = tableAlias
    ? `"${tableAlias}"."${centerField}"`
    : `"${centerField}"`;

  const caseStatement = targetCenterIds
    .map((id) => `${qualifiedField} = ${id}`)
    .join(' OR ');

  return [
    [literal(`CASE WHEN (${caseStatement}) THEN 1 ELSE 0 END`), 'DESC'],
    ['createdAt', 'DESC'],
  ];
};

export const addCenterFiltering = (
  whereCondition: Record<string, any> = {},
  targetCenterIds: (string | number)[],
  centerField = 'createdBy',
): Record<string, any> => {
  if (targetCenterIds.length > 0) {
    whereCondition[centerField] = {
      [Op.in]: targetCenterIds,
    };
  }

  return whereCondition;
};

/* ===================== MAIN ORCHESTRATOR ===================== */

export const processCenterGrouping = async (
  centerId: number | null,
  options: ProcessCenterGroupingOptions = {},
) => {
  const {
    centerField = 'createdBy',
    defaultOrder = [['createdAt', 'DESC']],
    tableAlias = '',
  } = options;

  const targetInfo = await resolveTargetCenters(centerId);

  const orderClause = generateSortingOrder(
    targetInfo.targetCenterIds,
    centerField,
    defaultOrder,
    tableAlias,
  );

  return {
    ...targetInfo,
    orderClause,
    centerField,
  };
};

/* ===================== DEBUG ===================== */

export const logGroupingInfo = (groupingInfo: ResolveTargetCentersResult & { orderClause?: any }) => {
  console.log('=== Center Grouping Info ===');
  console.log(`Requested Center: ${groupingInfo.requestedCenter ?? 'None'}`);
  console.log(
    `Target Centers: ${
      groupingInfo.targetCenterIds.length
        ? groupingInfo.targetCenterIds.join(', ')
        : 'ALL_CENTERS'
    }`,
  );
  console.log(`Is Group Search: ${groupingInfo.isGroupSearch}`);
  console.log(`Is All Centers Search: ${groupingInfo.isAllCentersSearch}`);
  if (groupingInfo.groupInfo) {
    console.log(`Group Name: ${groupingInfo.groupInfo.groupName}`);
  }
  console.log('============================');
};
