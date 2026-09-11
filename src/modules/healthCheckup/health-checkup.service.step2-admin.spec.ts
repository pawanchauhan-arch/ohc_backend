import { HealthCheckupService } from './health-checkup.service';
import { driverhealthcheckup } from 'src/models/DriverHealthCheckup';
import { Packagemanagment } from 'src/models/packagemanagment.model';
import { updateDriverHealthCheckupAsAdmin } from 'src/utils/driver-health-checkup-admin-update.util';
import { sendSuccess, sendError } from 'src/utils/response.util';

jest.mock('src/utils/response.util', () => ({
  sendSuccess: jest.fn(),
  sendError: jest.fn(),
}));
jest.mock('src/utils/driver-health-checkup-admin-update.util');
jest.mock('src/models/packagemanagment.model', () => ({
  Packagemanagment: {
    findAll: jest.fn(),
  },
}));
jest.mock('src/models/DriverHealthCheckup', () => ({
  driverhealthcheckup: {
    update: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
}));

describe('HealthCheckupService createHealthDataStep2 admin branch', () => {
  let healthCheckupService: HealthCheckupService;
  const mockLabResultService = { syncMobilabTestsToTables: jest.fn() };
  const mockSequelize = { transaction: jest.fn() };
  const mockUpdate = driverhealthcheckup.update as jest.Mock;
  const mockFindOne = driverhealthcheckup.findOne as jest.Mock;
  const mockFindByPk = driverhealthcheckup.findByPk as jest.Mock;
  const mockUpdateAsAdmin = updateDriverHealthCheckupAsAdmin as jest.Mock;

  const mockHealthListService = { viewHealthData: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    healthCheckupService = new HealthCheckupService(
      mockSequelize as never,
      mockLabResultService as never,
      mockHealthListService as never,
    );
    mockUpdate.mockResolvedValue([1]);
    mockUpdateAsAdmin.mockResolvedValue([1]);
    mockFindByPk.mockResolvedValue({
      id: 1,
      confirm_report: 'no',
      report_confirmed_at: null,
    });
    mockFindOne.mockResolvedValue({
      toJSON: () => ({ id: 1, confirm_report: 'no' }),
      driver: null,
    });
    (Packagemanagment.findAll as jest.Mock).mockResolvedValue([
      { id: 36, package_id: '36', package_name: 'BASIC' },
    ]);
    jest
      .spyOn(healthCheckupService, 'syncSelectedTestsToDedicatedTables' as never)
      .mockResolvedValue({} as never);
    jest
      .spyOn(healthCheckupService, 'checkHealthData' as never)
      .mockResolvedValue({ concerns: [], summary: {} } as never);
    jest
      .spyOn(healthCheckupService, 'calculateTotalPackagePrice' as never)
      .mockResolvedValue('100' as never);
  });

  const buildReq = (isAdminCaller: boolean) => ({
    isAdminCaller,
    body: {
      last_insert_id: 1,
      selected_test: { spo2_unit: { value: '99' } },
      package_list: ['36'],
      confirm_report: 'no',
    },
  });

  const buildRes = () => ({});

  it('should use admin helper when caller is admin', async () => {
    const req = buildReq(true);
    const res = buildRes();
    await healthCheckupService.createHealthDataStep2(req, res);
    expect(mockUpdateAsAdmin).toHaveBeenCalledWith(
      { id: 1 },
      expect.objectContaining({ is_submited: true }),
    );
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(sendSuccess).toHaveBeenCalled();
    expect(sendError).not.toHaveBeenCalled();
  });

  it('should use normal update when caller is center user', async () => {
    const req = buildReq(false);
    const res = buildRes();
    await healthCheckupService.createHealthDataStep2(req, res);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ is_submited: true }),
      { where: { id: 1 } },
    );
    expect(mockUpdateAsAdmin).not.toHaveBeenCalled();
    expect(sendSuccess).toHaveBeenCalled();
  });
});
