const ABNORMAL_STATUS_MARKERS: readonly string[] = [
  'warning',
  'danger',
  'yellow',
  'amber',
  'red',
  'moderate',
  'high',
  'low',
];

interface ConcernItem {
  readonly parameter?: string;
  readonly value?: string | number;
  readonly level?: string;
}

interface FlattenedVital {
  readonly label: string;
  readonly value: string;
  readonly units: string;
  readonly status: string;
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function isAbnormalStatus(status: string): boolean {
  const normalizedStatus: string = status.toLowerCase();
  return ABNORMAL_STATUS_MARKERS.some((marker: string) =>
    normalizedStatus.includes(marker),
  );
}

function toDisplayValue(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toString();
  }
  return normalizeText(value);
}

function parseSelectedTest(selectedTest: unknown): Record<string, unknown> | null {
  if (!selectedTest) {
    return null;
  }
  if (typeof selectedTest === 'string') {
    try {
      const parsed: unknown = JSON.parse(selectedTest);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }
  if (typeof selectedTest === 'object' && !Array.isArray(selectedTest)) {
    return selectedTest as Record<string, unknown>;
  }
  return null;
}

function pushVitalIfPresent(
  flattened: FlattenedVital[],
  params: {
    readonly label: string;
    readonly value: unknown;
    readonly units: unknown;
    readonly status: unknown;
  },
): void {
  const value: string = toDisplayValue(params.value);
  const status: string = normalizeText(params.status);
  if (value.length === 0 || status.length === 0) {
    return;
  }
  flattened.push({
    label: params.label,
    value,
    units: normalizeText(params.units),
    status,
  });
}

function flattenChildrenArray(
  flattened: FlattenedVital[],
  children: unknown,
  parentLabel: string,
): void {
  if (!Array.isArray(children)) {
    return;
  }
  children.forEach((childNode: unknown) => {
    if (!childNode || typeof childNode !== 'object') {
      return;
    }
    const childRecord: Record<string, unknown> =
      childNode as Record<string, unknown>;
    pushVitalIfPresent(flattened, {
      label:
        normalizeText(childRecord.label) ||
        `${parentLabel} ${normalizeText(childRecord.key) || 'item'}`,
      value: childRecord.value,
      units: childRecord.units,
      status: childRecord.status,
    });
  });
}

function flattenVitals(selectedTest: unknown): FlattenedVital[] {
  const record: Record<string, unknown> | null = parseSelectedTest(selectedTest);
  if (!record) {
    return [];
  }
  const flattened: FlattenedVital[] = [];
  Object.keys(record).forEach((testKey: string) => {
    const node: unknown = record[testKey];
    if (!node || typeof node !== 'object' || Array.isArray(node)) {
      return;
    }
    const nodeRecord: Record<string, unknown> = node as Record<string, unknown>;
    const directLabel: string = normalizeText(nodeRecord.label) || testKey;
    pushVitalIfPresent(flattened, {
      label: directLabel,
      value: nodeRecord.value,
      units: nodeRecord.units,
      status: nodeRecord.status,
    });
    flattenChildrenArray(flattened, nodeRecord.children, directLabel);
    Object.keys(nodeRecord).forEach((childKey: string) => {
      if (childKey === 'children') {
        return;
      }
      const childNode: unknown = nodeRecord[childKey];
      if (!childNode || typeof childNode !== 'object' || Array.isArray(childNode)) {
        return;
      }
      const childRecord: Record<string, unknown> =
        childNode as Record<string, unknown>;
      pushVitalIfPresent(flattened, {
        label:
          normalizeText(childRecord.label) ||
          `${directLabel} ${childKey.replace(/_/g, ' ')}`,
        value: childRecord.value,
        units: childRecord.units,
        status: childRecord.status,
      });
      flattenChildrenArray(
        flattened,
        childRecord.children,
        normalizeText(childRecord.label) || childKey,
      );
    });
  });
  return flattened;
}

function formatConcernItems(concerns: readonly ConcernItem[]): string[] {
  return concerns
    .map((concern: ConcernItem) => {
      const label: string = normalizeText(concern.parameter);
      const value: string =
        concern.value !== undefined ? toDisplayValue(concern.value) : '';
      const level: string = normalizeText(concern.level);
      if (!label || !value) {
        return '';
      }
      const levelSuffix: string = level ? ` (${level})` : '';
      return `${label}${levelSuffix} - ${value}`;
    })
    .filter((line: string) => line.length > 0);
}

function formatAbnormalVitals(selectedTest: unknown): string[] {
  return flattenVitals(selectedTest)
    .filter((vital: FlattenedVital) => isAbnormalStatus(vital.status))
    .map((vital: FlattenedVital) => {
      const unitsText: string = vital.units ? ` ${vital.units}` : '';
      const normalizedStatus: string =
        vital.status.charAt(0).toUpperCase() + vital.status.slice(1);
      return `${vital.label} (${normalizedStatus}) - ${vital.value}${unitsText}`;
    });
}

function normalizeLabelKey(line: string): string {
  const labelPart: string = line.split(' - ')[0] ?? line;
  return labelPart
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function mergeDetailLines(
  vitalLines: readonly string[],
  concernLines: readonly string[],
): string[] {
  const merged: string[] = [];
  const seenLabelKeys: Set<string> = new Set();
  [...vitalLines, ...concernLines].forEach((line: string) => {
    if (!line) {
      return;
    }
    const labelKey: string = normalizeLabelKey(line);
    if (seenLabelKeys.has(labelKey)) {
      return;
    }
    seenLabelKeys.add(labelKey);
    merged.push(line);
  });
  return merged;
}

/**
 * Lists abnormal vital labels from selected_test for debug logging.
 */
export function listAbnormalVitalLabels(selectedTest: unknown): string[] {
  return flattenVitals(selectedTest)
    .filter((vital: FlattenedVital) => isAbnormalStatus(vital.status))
    .map((vital: FlattenedVital) => vital.label);
}

/**
 * Builds Instavans remarks with base fitness text plus failed/warning vitals.
 * Callers should pass selectedTest/concerns only when Instavans status is red.
 */
export function buildInstavansRemark(params: {
  readonly baseRemark: string;
  readonly selectedTest?: unknown;
  readonly concerns?: readonly ConcernItem[] | unknown;
}): string {
  const baseRemark: string = normalizeText(params.baseRemark);
  const concernsInput: readonly ConcernItem[] = Array.isArray(params.concerns)
    ? (params.concerns as readonly ConcernItem[])
    : [];
  const vitalLines: string[] = formatAbnormalVitals(params.selectedTest);
  const concernLines: string[] = formatConcernItems(concernsInput);
  const detailLines: string[] = mergeDetailLines(vitalLines, concernLines);
  if (detailLines.length === 0) {
    return baseRemark;
  }
  return `${baseRemark} Failed vitals: ${detailLines.join('; ')}`;
}
