import * as puppeteer from 'puppeteer';
import type { Logger } from '@nestjs/common';

/** Same shape as {@link HealthCheckupService.getDriverHealthReportDownloadPayload}. */
export type LmcHealthReportDownloadPayload = {
  drivers: any;
  metaData: Record<string, any>;
  centerMetaData: any;
  packageMetaData: { getPackageData: any[] };
};

export async function buildLmcHealthCheckupMainPdfFromPayload(
  payload: LmcHealthReportDownloadPayload,
  logger: Logger,
  reportRenderTimeoutMs: number,
): Promise<{ mainPdf: Buffer; meta: unknown } | null> {
    const d = payload.drivers;
    const meta = payload.metaData;
    void payload.centerMetaData?.getCenterUserData;
    const pkg = payload.packageMetaData?.getPackageData?.[0];
    if (!d || !pkg) {
      logger.error('[buildLmcHealthCheckupMainPdfFromPayload] Missing drivers or package row');
      return null;
    }

    const checkupDate = d.createdAt
      ? new Date(d.createdAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'N/A';

    
    
  
    // Build table rows
    // Remark/status styling per Health Checkup Report reference: success=green, warning=#ffa408, danger=red (bold in Health Data)
    let sr = 1;
    let tableRows = '';

    type RemarkStatus = 'success' | 'warning' | 'danger';
    // type RemarkStatus = 'success' | 'warning' | 'danger' | 'unknown';
    // const EYE_POWER_UNITS = new Set([
    //   'cylindrical_left_eye_unit',
    //   'cylindrical_right_eye_unit',
    //   'spherical_left_eye_unit',
    //   'spherical_right_eye_unit',
    // ]);
    // const CONSULTATION_WARNING_UNITS = new Set([
    //   'temperature_unit',
    //   'spo2_unit',
    //   'romberg_unit',
    // ]);
    // const COUNSELLING_WARNING_UNITS = new Set([
    //   'random_blood_sugar_unit',
    //   'haemoglobin_unit',
    //   'bmi_unit',
    //   'ecg_unit',
    // ]);
    // const REST_RECHECK_WARNING_UNITS = new Set([
    //   'pulse_unit',
    //   'pulmonary_function_test_unit',
    //   'diastolic_bp_unit',
    //   'systolic_bp_unit',
    // ]);
    // const CONSULTATION_DANGER_UNITS = new Set([
    //   'temperature_unit',
    //   'spo2_unit',
    //   'random_blood_sugar_unit',
    //   'haemoglobin_unit',
    //   'bmi_unit',
    //   'ecg_unit',
    //   'pulse_unit',
    //   'pulmonary_function_test_unit',
    //   'diastolic_bp_unit',
    //   'systolic_bp_unit',
    // ]);

    // const toNumber = (value: any): number | null => {
    //   if (value === null || value === undefined || value === '') return null;
    //   const num = Number(value);
    //   return Number.isFinite(num) ? num : null;
    // };
    // const normalize = (value: any): string => String(value ?? '').trim().toLowerCase();
    // const inRange = (value: number, min: number | null, max: number | null): boolean => {
    //   if (min !== null && max !== null) return value >= min && value <= max;
    //   if (min !== null) return value >= min;
    //   if (max !== null) return value <= max;
    //   return false;
    // };

    // const resolveNumericStatus = (unit: any): RemarkStatus => {
    //   const value = toNumber(unit?.value);
    //   if (value === null) return 'unknown';

    //   const standardMin = toNumber(unit?.standard_value_min);
    //   const standardMax = toNumber(unit?.standard_value_max);
    //   const warningBelowMin = toNumber(unit?.within_deviation_value_min_below);
    //   const warningBelowMax = toNumber(unit?.within_deviation_value_max_below);
    //   const warningAboveMin = toNumber(unit?.within_deviation_value_min);
    //   const warningAboveMax = toNumber(unit?.within_deviation_value_max);
    //   const outBelow = toNumber(unit?.out_of_range_below);
    //   const outAbove = toNumber(unit?.out_of_range);

    //   if ((outBelow !== null && value <= outBelow) || (outAbove !== null && value >= outAbove)) {
    //     return 'danger';
    //   }
    //   if (inRange(value, warningBelowMin, warningBelowMax) || inRange(value, warningAboveMin, warningAboveMax)) {
    //     return 'warning';
    //   }
    //   if (
    //     inRange(value, standardMin, standardMax) ||
    //     (standardMin !== null && value === standardMin) ||
    //     (standardMax !== null && value === standardMax) ||
    //     (standardMin !== null && standardMax === null && value >= standardMin) ||
    //     (standardMax !== null && standardMin === null && value <= standardMax)
    //   ) {
    //     return 'success';
    //   }
    //   return 'unknown';
    // };

    // const resolveOptionStatus = (unit: any): RemarkStatus => {
    //   const value = normalize(unit?.value);
    //   const optionOne = normalize(unit?.option_1 ?? unit?.option_one);
    //   const optionTwo = normalize(unit?.option_2 ?? unit?.option_two);
    //   if (optionOne && value === optionOne) return 'success';
    //   if (optionTwo && value === optionTwo) return 'warning';
    //   return 'danger';
    // };

    // const resolveStatus = (testKey: string, unit: any): RemarkStatus => {
    //   if (!unit) return 'unknown';
    //   const key = normalize(testKey);
    //   const value = normalize(unit?.value);

    //   if (key === 'hiv_unit') return 'success';
    //   if (key === 'alchol_test_unit' || key === 'alcohol_test_unit') {
    //     const alcoholVal = toNumber(unit?.value);
    //     if (alcoholVal === null) return 'unknown';
    //     if (alcoholVal === 0) return 'success';
    //     if (alcoholVal > 0 && alcoholVal <= 30) return 'warning';
    //     if (alcoholVal > 30) return 'danger';
    //     return 'unknown';
    //   }

    //   const hasNumericThresholdFields =
    //     toNumber(unit?.standard_value_min) !== null ||
    //     toNumber(unit?.standard_value_max) !== null ||
    //     toNumber(unit?.within_deviation_value_min_below) !== null ||
    //     toNumber(unit?.within_deviation_value_max_below) !== null ||
    //     toNumber(unit?.within_deviation_value_min) !== null ||
    //     toNumber(unit?.within_deviation_value_max) !== null ||
    //     toNumber(unit?.out_of_range_below) !== null ||
    //     toNumber(unit?.out_of_range) !== null;

    //   if (hasNumericThresholdFields && toNumber(unit?.value) !== null) {
    //     return resolveNumericStatus(unit);
    //   }
    //   if (value) {
    //     return resolveOptionStatus(unit);
    //   }
    //   return 'unknown';
    // };

    // const resolveReportOverrideRemark = (testKey: string, unit: any): string | null => {
    //   const key = normalize(testKey);
    //   const value = normalize(unit?.value);

    //   if (EYE_POWER_UNITS.has(key)) {
    //     const eyeVal = toNumber(unit?.value);
    //     if (eyeVal === null) return 'Invalid Value';
    //     const absValue = Math.abs(eyeVal);
    //     if (absValue <= 0.5) return 'Normal';
    //     if (absValue <= 2) return 'Trial Lens Test Recommended';
    //     return 'Mandatory Corrective Lens Recommended';
    //   }

    //   if (key === 'colour_blindness_unit') {
    //     if (value === 'negative') return 'PASS';
    //     if (value === 'positive') return 'FAIL';
    //     return 'N/A';
    //   }

    //   if (key === 'hiv_unit') {
    //     if (value === 'positive') return 'Consultation Recommended';
    //     if (value === 'negative') return 'PASS';
    //     return 'N/A';
    //   }

    //   return null;
    // };

    // const resolveRemarkByStatus = (testKey: string, status: RemarkStatus): string => {
    //   const key = normalize(testKey);

    //   if (status === 'unknown') return 'N/A';
    //   if (status === 'success') {
    //     if (key === 'alchol_test_unit' || key === 'alcohol_test_unit') return 'Pass';
    //     return 'PASS';
    //   }

    //   if (status === 'warning') {
    //     if (CONSULTATION_WARNING_UNITS.has(key)) return 'Consultation Recommended';
    //     if (COUNSELLING_WARNING_UNITS.has(key)) {
    //       return 'Counselling for Lifestyle Changes/Consultation Recommended';
    //     }
    //     if (REST_RECHECK_WARNING_UNITS.has(key)) return 'Take rest & Recheck/ Cosultation';
    //     if (EYE_POWER_UNITS.has(key)) return 'Trail Lens test Recommeded';
    //     if (key === 'vision_unit') return 'Detailed AR test recommended';
    //     if (key === 'colour_blindness_unit') return 'Traffic light knowledge required';
    //     if (key !== 'alchol_test_unit' && key !== 'hiv_unit' && key !== 'alcohol_test_unit') {
    //       return 'Moderate Hearning Issues';
    //     }
    //   }

    //   if (status === 'danger') {
    //     if (CONSULTATION_DANGER_UNITS.has(key)) return 'Consultation Recommended';
    //     if (EYE_POWER_UNITS.has(key) || key === 'vision_unit') {
    //       return 'Mandatory Corrective Lens Recommended';
    //     }
    //     if (key === 'alchol_test_unit' || key === 'hiv_unit' || key === 'alcohol_test_unit') {
    //       return 'Unfit/ Consultation Recommended';
    //     }
    //     if (key === 'hearing_unit') return 'Unfit without Hearning aid';
    //   }

    //   return 'N/A';
    // };

    // const resolveRemark = (testKey: string, unit: any, status: RemarkStatus): string => {
    //   if ((testKey === 'alchol_test_unit' || testKey === 'alcohol_test_unit') && status === 'warning') {
    //     return 'Counselling for Lifestyle Changes/Consultation Recommended';
    //   }
    //   if ((testKey === 'alchol_test_unit' || testKey === 'alcohol_test_unit') && status === 'danger') {
    //     return 'Consultation Recommended';
    //   }
    //   const overrideRemark = resolveReportOverrideRemark(testKey, unit);
    //   if (overrideRemark !== null) return overrideRemark;
    //   return resolveRemarkByStatus(testKey, status);
    // };

    const getRemarkStyle = (remark?: string | null, status?: RemarkStatus | string | null): { remarkClass: string; boldHealthData: boolean } => {
      const rTrim = (remark ?? '').trim();
      if (rTrim === 'N/A') return { remarkClass: 'remark-neutral', boldHealthData: false };

      const s = (status as RemarkStatus)?.toLowerCase?.();
      if (s === 'success') return { remarkClass: 'remark-pass', boldHealthData: false };
      if (s === 'warning') return { remarkClass: 'remark-warning', boldHealthData: false };
      if (s === 'danger') return { remarkClass: 'remark-red', boldHealthData: true };

      const r = rTrim || 'PASS';
      // Danger: Unfit, Mandatory Corrective Lens, Consultation Recommended (many tests)
      if (/\bUnfit\b/i.test(r) || /Mandatory Corrective Lens/i.test(r) || /Consultation Recommended/i.test(r)) {
        return { remarkClass: 'remark-red', boldHealthData: true };
      }
      // Warning: Recheck, Counselling, Trail Lens, Detailed AR, Traffic light, Moderate (hearing)
      if (/Recheck|Counselling|Trail Lens|Detailed AR|Traffic light|Moderate/i.test(r)) {
        return { remarkClass: 'remark-warning', boldHealthData: false };
      }
      if (/\bFAIL\b/i.test(r)) return { remarkClass: 'remark-red', boldHealthData: true };
      // Success: PASS or default
      return { remarkClass: 'remark-pass', boldHealthData: false };
    };

    /**
     * Report mapping for HIV (`CheckupReport.handleHiv` alignment).
     */
    const reportRemarkHiv = (
      rawValue: unknown,
    ): { remark: string; status: RemarkStatus | 'neutral' } => {
      const s = String(rawValue ?? '')
        .trim()
        .toLowerCase();
      if (s === 'negative') return { remark: 'PASS', status: 'success' };
      if (s === 'positive') return { remark: 'Consultation Recommended', status: 'danger' };
      return { remark: 'N/A', status: 'neutral' };
    };

    /**
     * Report mapping for colour blindness (`CheckupReport.handleEyeChild`): stored value Negative/Positive.
     */
    const reportRemarkColourBlindness = (
      rawValue: unknown,
    ): { remark: string; status: RemarkStatus | 'neutral' } => {
      const s = String(rawValue ?? '')
        .trim()
        .toLowerCase();
      if (s === 'negative') return { remark: 'PASS', status: 'success' };
      if (s === 'positive') return { remark: 'FAIL', status: 'danger' };
      return { remark: 'N/A', status: 'neutral' };
    };

    const normTxt = (raw: unknown): string =>
      String(raw ?? '')
        .trim()
        .toLowerCase();

    const isPlaceholderRemark = (raw: unknown): boolean => {
      const t = String(raw ?? '').trim();
      return t === '' || /^Enter value$/i.test(t);
    };

    /** Vision bands: option_1 → PASS; option_2 → Detailed AR…; else mandatory lens (`setFieldData` / report). */
    const remarkVisionFromOptions = (
      rawValue: unknown,
      defs: Record<string, unknown>,
    ): { remark: string; status: RemarkStatus | 'neutral' } => {
      const v = normTxt(rawValue);
      if (!v) return { remark: 'N/A', status: 'neutral' };
      const o1 = normTxt(
        defs.option_one ?? defs.option_1 ?? defs.optionOne ?? '',
      );
      const o2 = normTxt(
        defs.option_two ?? defs.option_2 ?? defs.optionTwo ?? '',
      );
      if (o1 && v === o1) return { remark: 'PASS', status: 'success' };
      if (o2 && v === o2)
        return { remark: 'Detailed AR test recommended', status: 'warning' };
      if (!o1 && !o2) {
        const stdPiece = normTxt(formatStd(defs.standard_value));
        if (stdPiece && v === stdPiece) return { remark: 'PASS', status: 'success' };
      }
      return {
        remark: 'Mandatory Corrective Lens Recommended',
        status: 'danger',
      };
    };

    const statusFromStoredVisionRemark = (
      remarkText: string,
    ): RemarkStatus | 'neutral' | undefined => {
      const z = remarkText.trim();
      const low = z.toLowerCase();
      if (low === 'pass') return 'success';
      if (/Detailed AR/i.test(z)) return 'warning';
      if (/Trail Lens|trail lens|Mandatory Corrective Lens/i.test(z))
        return 'danger';
      return undefined;
    };

    const statusFromStoredRombergRemark = (
      remarkText: string,
    ): RemarkStatus | undefined => {
      const t = remarkText.trim();
      if (/^pass$/i.test(t)) return 'success';
      if (/Consultation Recommended/i.test(t)) return 'warning';
      return undefined;
    };

    /** Romberg: option_1 → PASS; option_2 → Consultation Recommended (`setFieldData`). */
    const remarkRombergFromOptions = (
      rawValue: unknown,
      defs: Record<string, unknown>,
    ): { remark: string; status: RemarkStatus | 'neutral' } => {
      const v = normTxt(rawValue);
      if (!v) return { remark: 'N/A', status: 'neutral' };
      const o1 = normTxt(
        defs.option_one ?? defs.option_1 ?? defs.optionOne ?? '',
      );
      const o2 = normTxt(
        defs.option_two ?? defs.option_2 ?? defs.optionTwo ?? '',
      );
      if (o1 && v === o1) return { remark: 'PASS', status: 'success' };
      if (o2 && v === o2)
        return { remark: 'Consultation Recommended', status: 'warning' };
      if (!o1 && !o2) {
        if (v === 'negative') return { remark: 'PASS', status: 'success' };
        if (v === 'positive')
          return { remark: 'Consultation Recommended', status: 'warning' };
      }
      return { remark: 'N/A', status: 'neutral' };
    };

    type AddRowOptions = { omitRemark?: boolean };

    const addRow = (
      name: string,
      value: unknown,
      unit: string,
      std: string,
      remark?: string | null,
      status?: RemarkStatus | string | null | 'neutral',
      options?: AddRowOptions,
    ) => {
      const omitRemark = options?.omitRemark === true;
      const safeRemark = omitRemark ? '' : remark?.trim() || 'PASS';
      const { remarkClass, boldHealthData } = omitRemark
        ? { remarkClass: 'remark-empty', boldHealthData: false }
        : status === 'neutral'
          ? getRemarkStyle(remark ?? 'N/A', undefined)
          : getRemarkStyle(remark, status);
      const healthDataCell = boldHealthData
        ? `<td class="health-data-danger"><strong>${value ?? '-'}</strong></td>`
        : `<td><strong>${value ?? '-'}</strong></td>`;

      tableRows += `
        <tr>
          <td>${sr++}</td>
          <td>${name}</td>
          ${healthDataCell}
          <td>${unit}</td>
          <td>${std}</td>
          <td class="${remarkClass}">${omitRemark ? '' : safeRemark}</td>
        </tr>`;
    };

    const formatStd = (val: any): string => {
      if (val === undefined || val === null) return '';
      if (Array.isArray(val)) {
        if (val.length === 0) return '';
        if (val.length === 2) return `${val[0]}-${val[1]}`;
        return val.join(', ');
      }
      return String(val);
    };

    /** True if object looks like a single test unit (has value + optional label, units, remark). */
    const isLeafUnit = (obj: any): boolean =>
      obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, 'value');

    /** Add one table row from a leaf unit object (supports unit.status from health checkup form). */
    // const addRowFromUnit = (testKey: string, unit: any, fallbackLabel: string) => {
      const addRowFromUnit = (unit: any, fallbackLabel: string, vitalsMetaKey?: string) => {
        if (vitalsMetaKey === 'vision_unit') return;
        if (unit.value === undefined) return;
        const label =
          typeof unit.label === 'string' && unit.label.trim().length > 0
            ? unit.label
            : fallbackLabel;

        let stdDisp = formatStd(unit.standard_value);
        let remarkOut: string | null = unit.remark ?? null;
        let statusOut: RemarkStatus | string | null | 'neutral' = unit.status ?? null;

        if (vitalsMetaKey === 'hiv_unit') {
          const o = reportRemarkHiv(unit.value);
          remarkOut = o.remark;
          statusOut = o.status === 'neutral' ? 'neutral' : o.status;
        } else if (vitalsMetaKey === 'colour_blindness_unit') {
          const o = reportRemarkColourBlindness(unit.value);
          remarkOut = o.remark;
          statusOut = o.status === 'neutral' ? 'neutral' : o.status;
          if (!stdDisp) stdDisp = 'Negative';
        } else if (vitalsMetaKey === 'romberg_unit') {
          const selR =
            ((d.selected_test ?? {}) as { romberg_unit?: Record<string, unknown> })
              .romberg_unit ?? {};
          const merged: Record<string, unknown> = { ...unit, ...selR };
          const stored = merged.remark;
          const computed = remarkRombergFromOptions(unit.value, merged);
          if (isPlaceholderRemark(stored)) {
            remarkOut = computed.remark;
            statusOut =
              computed.status === 'neutral' ? 'neutral' : computed.status;
          } else {
            remarkOut = String(stored).trim();
            const inferredR = statusFromStoredRombergRemark(remarkOut);
            statusOut =
              inferredR ??
              (merged.status as string | undefined) ??
              computed.status ??
              undefined;
          }
        }

        addRow(label, unit.value, unit.units ?? '', stdDisp, remarkOut, statusOut);
      };

    // Dynamically add rows for whatever tests are present in metaData
    if (meta && typeof meta === 'object') {
      const metaObj = meta as Record<string, any>;

      // 1) Blood pressure: direct nested keys OR health-checkup `children` meta OR raw selected_test
      const bpMeta = metaObj.blood_pressure_unit;
      const bpSel = (d.selected_test?.blood_pressure_unit ?? null) as Record<
        string,
        unknown
      > | null;
      const childToLeaf = (child: {
        key?: string;
        value?: unknown;
        units?: unknown;
        standard_value?: unknown;
        remark?: unknown;
        status?: unknown;
      }) => ({
        value: child.value,
        units: child.units ?? '',
        standard_value: child.standard_value ?? '',
        remark: child.remark,
        status: child.status,
      });
      const resolveBpLeaf = (subKey: 'systolic_bp_unit' | 'diastolic_bp_unit') => {
        const fromMeta = bpMeta?.[subKey];
        if (isLeafUnit(fromMeta)) return fromMeta;
        const fromSel = bpSel?.[subKey];
        if (isLeafUnit(fromSel)) return fromSel;
        const ch = (
          bpMeta as {
            children?: {
              key?: string;
              value?: unknown;
              units?: unknown;
              standard_value?: unknown;
              remark?: unknown;
              status?: unknown;
            }[];
          } | null
        )?.children;
        if (Array.isArray(ch)) {
          const hit = ch.find((c) => c?.key === subKey);
          if (hit && hit.value !== undefined) return childToLeaf(hit);
        }
        return null;
      };
      const sysLeaf = resolveBpLeaf('systolic_bp_unit');
      const diaLeaf = resolveBpLeaf('diastolic_bp_unit');
      if (isLeafUnit(sysLeaf)) {
        addRowFromUnit(sysLeaf, 'BP Systolic', 'systolic_bp_unit');
      }
      if (isLeafUnit(diaLeaf)) {
        addRowFromUnit(diaLeaf, 'BP Diastolic', 'diastolic_bp_unit');
      }

      // 2) All other meta keys (vision_unit rendered separately: left / right eye)
      Object.entries(metaObj).forEach(([key, raw]) => {
        if (!raw || key === 'blood_pressure_unit' || key === 'vision_unit') return;

        // 2a) Simple unit: has top-level .value (ecg, temperature, spo2, bmi, pulse, haemoglobin, etc.)
        if (isLeafUnit(raw)) {
          const fallbackLabel = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
          addRowFromUnit(raw, fallbackLabel, key);
          return;
        }

        // 2c) Health-checkup service nested shape: { key, label, children: [{ key, label, value, ... }] }
        if (
          typeof raw === 'object' &&
          !Array.isArray(raw) &&
          Array.isArray((raw as { children?: unknown }).children)
        ) {
          ((raw as { children: any[] }).children).forEach((child: any) => {
            if (!child || child.value === undefined) return;
            const childKey = typeof child.key === 'string' ? child.key : '';
            const unitLike = {
              value: child.value,
              label: child.label,
              units: child.units ?? '',
              standard_value: child.standard_value ?? '',
              remark: child.remark,
              status: child.status,
            };
            const fb =
              typeof child.label === 'string' && child.label.trim().length > 0
                ? child.label.trim()
                : childKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
            addRowFromUnit(unitLike, fb, childKey);
          });
          return;
        }

        // 2b) Nested group: leaf units on object (e.g. blood_pressure style without children)
        if (typeof raw === 'object' && !Array.isArray(raw)) {
          Object.entries(raw).forEach(([subKey, subVal]: [string, any]) => {
            if (isLeafUnit(subVal)) {
              const fallbackLabel = subKey.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              addRowFromUnit(subVal, fallbackLabel, subKey);
            }
          });
        }
      });

      // 2d) Vision: two rows (left / right) with option-band remarks; avoids single stacked "Vision" + Enter value.
      const emitVisionUnitRows = () => {
        const selVu = (d.selected_test?.vision_unit ?? null) as Record<
          string,
          unknown
        > | null;
        const metaVu = metaObj.vision_unit;
        const hasVision =
          (selVu != null &&
            typeof selVu === 'object' &&
            Object.keys(selVu).length > 0) ||
          metaVu != null;
        if (!hasVision) return;
        let vu: Record<string, unknown> =
          typeof metaVu === 'object' &&
          metaVu !== null &&
          !Array.isArray((metaVu as { children?: unknown }).children)
            ? { ...(metaVu as object), ...(selVu ?? {}) }
            : { ...(selVu ?? {}) };
        const ch = (metaVu as { children?: { key?: string; value?: unknown; remark?: string }[] } | null)
          ?.children;
        if (Array.isArray(ch)) {
          for (const c of ch) {
            if (!c?.key) continue;
            const k = c.key;
            if (k === 'left_eye_value')
              vu.left_eye_value = c.value ?? vu.left_eye_value;
            else if (k === 'right_eye_value')
              vu.right_eye_value = c.value ?? vu.right_eye_value;
            else if (k === 'left_eye') {
              vu.left_eye_value = c.value ?? vu.left_eye_value;
              if (normTxt(c.remark)) vu.left_eye_remark = c.remark;
            } else if (k === 'right_eye') {
              vu.right_eye_value = c.value ?? vu.right_eye_value;
              if (normTxt(c.remark)) vu.right_eye_remark = c.remark;
            } else if (k === 'value') vu.value = c.value ?? vu.value;
          }
        }
        const nonempty = (val: unknown) =>
          val !== undefined &&
          val !== null &&
          String(val).trim() !== '';
        const centerRaw = vu.value;
        const leftRaw =
          vu.left_eye_value ??
          (vu.left_eye as { value?: unknown } | undefined)?.value;
        const rightRaw =
          vu.right_eye_value ??
          (vu.right_eye as { value?: unknown } | undefined)?.value;
        if (
          !nonempty(centerRaw) &&
          !nonempty(leftRaw) &&
          !nonempty(rightRaw)
        ) {
          return;
        }
        const unitsStr =
          typeof vu.units === 'string' && vu.units.trim().length > 0
            ? vu.units
            : '';
        const stdVision =
          formatStd(vu.standard_value) || 'Per package standard';
        const leftDisp = nonempty(leftRaw) ? leftRaw : centerRaw ?? '—';
        const rightDisp = nonempty(rightRaw) ? rightRaw : centerRaw ?? '—';
        const leftRemarkStored =
          (vu.left_eye_remark as string | undefined) ??
          (
            vu.left_eye as { remark?: string } | undefined
          )?.remark;
        const rightRemarkStored =
          (vu.right_eye_remark as string | undefined) ??
          (
            vu.right_eye as { remark?: string } | undefined
          )?.remark;
        const attachEyeRow = (
          label: string,
          eyeVal: unknown,
          storedEyeRemark: unknown,
        ) => {
          const computed = remarkVisionFromOptions(eyeVal, vu);
          let remarkEye: string;
          let statEye: RemarkStatus | string | null | 'neutral';
          const storedStr =
            typeof storedEyeRemark === 'string' ? storedEyeRemark.trim() : '';
          if (
            !isPlaceholderRemark(storedEyeRemark) &&
            normTxt(storedStr)
          ) {
            remarkEye = storedStr;
            const inferred = statusFromStoredVisionRemark(remarkEye);
            statEye =
              inferred ??
              (vu.status as string | undefined) ??
              computed.status ??
              undefined;
          } else {
            remarkEye = computed.remark;
            statEye =
              computed.status === 'neutral' ? 'neutral' : computed.status;
          }
          addRow(label, eyeVal, unitsStr, stdVision, remarkEye, statEye);
        };
        attachEyeRow('Vision (Left Eye)', leftDisp, leftRemarkStored);
        attachEyeRow('Vision (Right Eye)', rightDisp, rightRemarkStored);
      };

      emitVisionUnitRows();

      // 3) Height / Weight: metaData transforms bmi_unit to a leaf (value/units only) and drops extras.
      //    Read from raw selected_test on the checkup row when present.
      const bmiForHeightWeight =
        d.selected_test?.bmi_unit ?? metaObj.bmi_unit;
      if (bmiForHeightWeight && typeof bmiForHeightWeight === 'object') {
        const bh = bmiForHeightWeight.height;
        const bw = bmiForHeightWeight.weight;
        if (bh !== undefined && bh !== null && String(bh).trim() !== '') {
          addRow('Height', bh, 'cm', '', null, null, { omitRemark: true });
        }
        if (bw !== undefined && bw !== null && String(bw).trim() !== '') {
          addRow('Weight', bw, 'kg', '', null, null, { omitRemark: true });
        }
      }
    }
    const doctorUser = d.doctor?.user ?? d.doctor?.User;
    const doctorName = doctorUser?.username ?? 'N/A';
    const doctorReg = d.doctor?.registration_number ?? 'N/A';
    const doctorQual = d.doctor?.qualification ?? 'N/A';
    const doctorSignature =
      d.doctor?.signature || 'https://yourdomain.com/images/no-signature.png';
    const driverName = d.driver?.name ?? 'N/A';
    const driverExternalId = d.driver?.external_id ?? 'N/A';
    const clientName = d.CETMANAGEMENT?.name ?? 'N/A';
    // Replace all placeholders
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Health Report - ${driverExternalId}</title>
  <style>
    body { margin: 0; padding: 40px 50px; font-family: Arial, sans-serif; font-size: 13px; color: #000; }
    .container { { max-width: 900px; margin: 0 auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
    .logo-left { width: 140px; }
    .logo-right { width: 120px; }
    .center-title { text-align: center; flex: 1; margin: 0 30px; }
    .center-title h1 { font-size: 26px; font-weight: bold; margin: 0 0 8px 0; color: #003087; }
    .center-info { font-size: 13px; line-height: 1.7; }
    .center-info a { color: #003087; text-decoration: none; }
    .intro { text-align: justify; margin: 30px 0; font-size: 14px; line-height: 1.7; }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 40px;
      margin: 30px 0;
      font-size: 13px;
    }
    .section-title { font-weight: bold; font-size: 15px; color: #003087; margin-bottom: 12px; }
    .detail-row { display: flex; margin: 10px 0; }
    .detail-label { width: 180px; font-weight: 600; }
    table { width: 100%; border-collapse: collapse; margin: 35px 0; font-size: 13px; }
    th, td { border: 1px solid #333; padding: 12px 10px; text-align: center; }
    th { background-color: #f0f0f0; font-weight: bold; }
    .remark-red { color: red; font-weight: bold; }
    .remark-warning { color: #ffa408; font-weight: bold; }
    .remark-pass { color: green; font-weight: bold; }
    .remark-neutral { color: #444; font-weight: normal; }
    .remark-empty { color: #444; font-weight: normal; }
    .health-data-danger { color: red; font-weight: bold; }
    .signatures { display: flex; justify-content: flex-end; margin-top: 80px; padding: 0 60px; }
    .sig-box { text-align: center; width: 48%; }
    .sig-img { width: 240px; height: 110px; object-fit: contain; border-bottom: 2px solid #000; margin-bottom: 10px; }
    .footer { margin-top: 70px; font-size: 12px; line-height: 1.8; }
    .emergency { margin-top: 30px; font-size: 15px; font-weight: bold; color: #d32f2f; }
    @page { size: A4; margin: 0.7in; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://mediaandfiles.s3.amazonaws.com/uploads/1771324218657-Last-Mile-Care_logo.jpg" class="logo-left">
      <div class="center-title">
        <h1>Last Mile Care Private Limited</h1>
        <div class="center-info">
           Address: 3rd Floor, Space Creattors Heights, Landmark Cyberpark,
          Sector-67, Gurugram, Haryana -122018<br>
          Email us: <a href="mailto:info@lastmilecare.in">info@lastmilecare.in</a> || Contact us: <a href="tel:+918092102102">+91 80921 02102</a>
        </div>
      </div>
    </div>

    <p class="intro">
      It is to certify that Last Mile Care Pvt Ltd has conducted 
       <strong>${pkg.package_name}</strong> for the following personnel and found as per the measured readings.
    </p>

    <div class="details-grid">
      <div>
        <div class="section-title">DOCTOR'S DETAILS:</div>
        <div class="detail-row"><span class="detail-label">Doctor's Name</span> ${doctorName}</div>
        <div class="detail-row"><span class="detail-label">Registration Number</span> ${doctorReg}</div>
      </div>
      <div>
        <div class="section-title">PATIENT'S DETAILS:</div>
        <div class="detail-row"><span class="detail-label">Date of Checkup</span> ${checkupDate}</div>
        <div class="detail-row"><span class="detail-label">Name of the Personnel</span> ${driverName}</div>
        <div class="detail-row"><span class="detail-label">LMC ID</span> ${driverExternalId}</div>
        ${d.driver?.healthCardNumber ? `<div class="detail-row"><span class="detail-label">Health Card Number</span> ${d.driver.healthCardNumber}</div>` : ''}
      </div>
      <div>
        <div class="detail-row"><span class="detail-label">Designation of Doctor</span> ${doctorQual}</div>
      </div>
      <div>
        <div class="detail-row"><span class="detail-label"> Date of Birth </span> ${d.driver?.dateOfBirthOrAge || 'N/A'}</div>
        <div class="detail-row"><span class="detail-label">Name of Client</span> ${clientName}</div>
        <div class="detail-row"><span class="detail-label">Mobile No. </span> ${d.driver?.contactNumber ?? 'N/A'}</div>
        ${d.driver?.DRIVERMASTERPERSONAL?.blood_group ? `<div class="detail-row"><span class="detail-label">Blood Group</span> ${d.driver.DRIVERMASTERPERSONAL.blood_group}</div>` : ''}
        <div class="detail-row"><span class="detail-label">ABHA Number</span> ${d.driver?.abhaNumber || 'N/A'}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>No</th><th>Test Name</th><th>Health Data</th><th>Units</th><th>Standard Value</th><th>Remarks</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div class="signatures">
      <div class="sig-box">
        <img src="${doctorSignature}" class="sig-img">
        <p><strong>Signature of 1Care Doctor</strong></p>
      </div>
    </div>

    <div class="footer">
      <p><strong>DECLARATION:</strong> I/We hereby agree and declare that the medical health checkup statements and reports will be generated based on the devices and medical equipment contract issued or renewed between myself/ourselves and the Company. I/We have made a complete, true, and accurate disclosure of all relevant facts and circumstances, without withholding any information that may be pertinent for the Company to make an informed decision regarding the acceptability of the risk. Additionally, I fully understand that the Company reserves the right to impose any recheck-up procedure by or after consulting our healthcare providers as a result of underwriting. I am also aware that, at the time of renewal, the cost of medical examinations and special tests, if any, will be borne accordingly. Units, if any, will be allocated on the reinstatement date. I/We undertake to notify the Company in writing of any changes in the statements made in the declaration of good health form after signing this declaration and before the acceptance of risk and revival of the drivers or riders by the Company.</p>
      <p><strong>DISCLAIMER:</strong> The tests have been conducted in a closed environment with a qualified professional, and the results mentioned are based on the patient's physical condition at the time of the test. The beneficiary has been given information about the diagnostic tests, and the beneficiary has given consent for conducting & reporting the data with the relevant stakeholders.</p>
      <p class="emergency">
        In Case of an Emergency call us on <strong>+91 80921 02102</strong> Or Email us at: 
        <a href="mailto:info@lastmilecare.in">info@lastmilecare.in</a>
      </p>
    </div>
  </div>
</body>
</html>`;

    let browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(reportRenderTimeoutMs);
    page.setDefaultTimeout(reportRenderTimeoutMs);

    // `networkidle0` is strict and can timeout if remote assets are slow; retry with a lighter strategy.
    try {
      await page.setContent(html, {
        waitUntil: ['domcontentloaded', 'networkidle2'],
        timeout: reportRenderTimeoutMs,
      });
    } catch (error) {
      logger.warn(
        `[buildLmcHealthCheckupMainPdfFromPayload] Primary HTML render timed out for healthCheckupId=${d?.id ?? 'unknown'}. Retrying with domcontentloaded only. reason=${error?.message || error}`,
      );
      await page.setContent(html, {
        waitUntil: 'domcontentloaded',
        timeout: reportRenderTimeoutMs,
      });
    }

    const pdf = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    const mainReportBuffer: Buffer = Buffer.from(pdf);
    return { mainPdf: mainReportBuffer, meta };
}
