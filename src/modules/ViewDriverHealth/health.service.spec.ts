import { Test, TestingModule } from '@nestjs/testing';
import { Sequelize } from 'sequelize-typescript';
import { QueryTypes } from 'sequelize';
import { HealthService } from './health.service';
import {
  classifyServiceType,
  getOperationalDateRangeWindow,
  getOperationalDayWindow,
  resolveShiftCode,
} from '../../utils/operational-day.util';
import {
  buildEmptyShiftSummary,
  foldShiftAggregationRows,
} from './utils/shift-summary.util';

describe('operational-day.util', () => {
  describe('getOperationalDayWindow', () => {
    it('should return 06:00 IST to next day 05:59:59.999 IST as UTC bounds', () => {
      const window = getOperationalDayWindow('2026-06-10');
      expect(window.startUtc).toBe('2026-06-10T00:30:00Z');
      expect(window.endUtc).toBe('2026-06-11T00:29:59Z');
    });
  });

  describe('getOperationalDateRangeWindow', () => {
    it('should use one full operational day when start and end are the same', () => {
      const window = getOperationalDateRangeWindow('2026-06-10', '2026-06-10');
      expect(window.startUtc).toBe('2026-06-10T00:30:00Z');
      expect(window.endUtc).toBe('2026-06-11T00:29:59Z');
    });

    it('should end at endDate 05:59 IST for a multi-day range (not next morning after endDate)', () => {
      // 19–20 Aug => 19 06:00 through 20 05:59 (excludes 20 Aug daytime)
      const window = getOperationalDateRangeWindow('2026-08-19', '2026-08-20');
      expect(window.startUtc).toBe('2026-08-19T00:30:00Z');
      expect(window.endUtc).toBe('2026-08-20T00:29:59Z');
    });

    it('should span startDate 06:00 through endDate 05:59 for longer ranges', () => {
      const window = getOperationalDateRangeWindow('2026-06-10', '2026-06-12');
      expect(window.startUtc).toBe('2026-06-10T00:30:00Z');
      expect(window.endUtc).toBe('2026-06-12T00:29:59Z');
    });
  });

  describe('resolveShiftCode', () => {
    it('should map 06:00-13:59 IST to shift A', () => {
      expect(resolveShiftCode(6)).toBe('A');
      expect(resolveShiftCode(13)).toBe('A');
    });

    it('should map 14:00-21:59 IST to shift B', () => {
      expect(resolveShiftCode(14)).toBe('B');
      expect(resolveShiftCode(21)).toBe('B');
    });

    it('should map 22:00-05:59 IST to shift C', () => {
      expect(resolveShiftCode(22)).toBe('C');
      expect(resolveShiftCode(5)).toBe('C');
      expect(resolveShiftCode(0)).toBe('C');
    });
  });

  describe('classifyServiceType', () => {
    it('should classify BASIC packages', () => {
      expect(classifyServiceType(['BASIC'])).toBe('basic');
    });

    it('should classify ADVANCED-ANGUL as advance', () => {
      expect(classifyServiceType(['ADVANCED-ANGUL'])).toBe('advance');
    });

    it('should classify COUNSELLING packages', () => {
      expect(classifyServiceType(['COUNSELLING'])).toBe('counselling');
    });

    it('should return null for unclassified packages', () => {
      expect(classifyServiceType(['LAB TEST'])).toBeNull();
      expect(classifyServiceType(null)).toBeNull();
    });

    it('should prioritise counselling over basic and advance', () => {
      expect(classifyServiceType(['BASIC', 'COUNSELLING'])).toBe('counselling');
    });
  });
});

describe('shift-summary.util', () => {
  const window = getOperationalDayWindow('2026-06-10');
  const emptySummary = buildEmptyShiftSummary('2026-06-10', 45, window);

  describe('foldShiftAggregationRows', () => {
    it('should fold aggregation rows into shift and overall totals', () => {
      const result = foldShiftAggregationRows(emptySummary, [
        { shift: 'A', service_type: 'basic', count: 3, record_ids: [10, 9, 8] },
        { shift: 'A', service_type: 'advance', count: 2, record_ids: [7, 6] },
        { shift: 'B', service_type: 'counselling', count: 1, record_ids: [5] },
        { shift: 'C', service_type: 'basic', count: 1, record_ids: [4] },
      ]);
      expect(result.shifts.A).toEqual({
        basic: 3,
        advance: 2,
        counselling: 0,
        total: 5,
        record_ids: {
          basic: [10, 9, 8],
          advance: [7, 6],
          counselling: [],
        },
      });
      expect(result.shifts.B.counselling).toBe(1);
      expect(result.shifts.B.record_ids.counselling).toEqual([5]);
      expect(result.shifts.C.basic).toBe(1);
      expect(result.overall).toEqual({
        basic: 4,
        advance: 2,
        counselling: 1,
        total: 7,
      });
    });

    it('should ignore unknown shift or service type rows', () => {
      const result = foldShiftAggregationRows(emptySummary, [
        { shift: 'D', service_type: 'basic', count: 5 },
        { shift: 'A', service_type: null, count: 5 },
      ]);
      expect(result.overall.total).toBe(0);
    });
  });
});

describe('HealthService', () => {
  let healthService: HealthService;
  const mockQuery = jest.fn();

  beforeEach(async () => {
    mockQuery.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: Sequelize,
          useValue: { query: mockQuery },
        },
      ],
    }).compile();
    healthService = module.get<HealthService>(HealthService);
  });

  describe('getShiftSummary', () => {
    it('should query ready checkups and return folded shift summary', async () => {
      mockQuery.mockResolvedValue([
        { shift: 'A', service_type: 'basic', count: 2, record_ids: [102, 101] },
        { shift: 'B', service_type: 'advance', count: 1, record_ids: [99] },
      ]);
      const actual = await healthService.getShiftSummary({
        center_id: 45,
        operational_date: '2026-06-10',
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('dhc.date_time'),
        expect.objectContaining({
          replacements: {
            center_ids: [45],
            windowStart: '2026-06-10T00:30:00Z',
            windowEnd: '2026-06-11T00:29:59Z',
          },
          type: QueryTypes.SELECT,
        }),
      );
      expect(actual.status).toBe(true);
      expect(actual.data.operational_date).toBe('2026-06-10');
      expect(actual.data.center_id).toBe(45);
      expect(actual.data.shifts.A.basic).toBe(2);
      expect(actual.data.shifts.A.record_ids.basic).toEqual([102, 101]);
      expect(actual.data.shifts.B.advance).toBe(1);
      expect(actual.data.shifts.B.record_ids.advance).toEqual([99]);
      expect(actual.data.overall.total).toBe(3);
    });

    it('should return zero-filled shifts when no rows match', async () => {
      mockQuery.mockResolvedValue([]);
      const actual = await healthService.getShiftSummary({
        center_id: 45,
        operational_date: '2026-06-10',
      });
      expect(actual.data.shifts.A.total).toBe(0);
      expect(actual.data.overall.total).toBe(0);
    });

    it('should aggregate across comma-separated center_id values', async () => {
      mockQuery.mockResolvedValue([
        { shift: 'A', service_type: 'basic', count: 4, record_ids: [4, 3, 2, 1] },
      ]);
      const actual = await healthService.getShiftSummary({
        center_id: '45,46,47',
        operational_date: '2026-06-10',
      });
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('dhc."createdBy" IN'),
        expect.objectContaining({
          replacements: expect.objectContaining({
            center_ids: [45, 46, 47],
          }),
        }),
      );
      expect(actual.data.center_id).toBe('45,46,47');
      expect(actual.data.shifts.A.basic).toBe(4);
      expect(actual.data.shifts.A.record_ids.basic).toEqual([4, 3, 2, 1]);
    });
  });
});
