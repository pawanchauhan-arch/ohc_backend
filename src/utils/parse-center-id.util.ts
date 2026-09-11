import { BadRequestException } from '@nestjs/common';

export interface ParseCenterIdResult {
  centerIds: number[];
  isMultiCenter: boolean;
  normalizedInput: number | string;
}

/**
 * Parses center_id from a single ID (number or string) or comma-separated ID list.
 */
export function parseCenterId(
  centerId: unknown,
  options: { required?: boolean } = {},
): ParseCenterIdResult {
  const { required = false } = options;
  if (centerId === undefined || centerId === null) {
    if (required) {
      throw new BadRequestException('center_id is required');
    }
    return { centerIds: [], isMultiCenter: false, normalizedInput: '' };
  }
  const raw = String(centerId).trim();
  if (!raw) {
    if (required) {
      throw new BadRequestException('center_id is required');
    }
    return { centerIds: [], isMultiCenter: false, normalizedInput: '' };
  }
  const segments = raw.split(',').map((segment) => segment.trim()).filter(Boolean);
  const centerIds: number[] = [];
  const seen = new Set<number>();
  segments.forEach((segment) => {
    if (!/^\d+$/.test(segment)) {
      return;
    }
    const id = Number(segment);
    if (!seen.has(id)) {
      seen.add(id);
      centerIds.push(id);
    }
  });
  if (centerIds.length === 0) {
    throw new BadRequestException('Invalid center_id');
  }
  const isMultiCenter = centerIds.length > 1;
  const normalizedInput = isMultiCenter ? centerIds.join(',') : centerIds[0];
  return { centerIds, isMultiCenter, normalizedInput };
}
