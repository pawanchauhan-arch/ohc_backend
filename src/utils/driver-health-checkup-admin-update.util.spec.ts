import { driverhealthcheckup } from '../models/DriverHealthCheckup';
import {
  saveDriverHealthCheckupAsAdmin,
  updateDriverHealthCheckupAsAdmin,
} from './driver-health-checkup-admin-update.util';

jest.mock('../models/DriverHealthCheckup', () => ({
  driverhealthcheckup: {
    update: jest.fn(),
  },
}));

describe('driver-health-checkup-admin-update.util', () => {
  const mockUpdate = driverhealthcheckup.update as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUpdate.mockResolvedValue([1]);
  });

  describe('saveDriverHealthCheckupAsAdmin', () => {
    it('should set updated_by_admin_at and save with silent true', async () => {
      const mockSave = jest.fn().mockResolvedValue(undefined);
      const inputInstance = {
        vehicle_no: 'OLD',
        updated_by_admin_at: null,
        save: mockSave,
      } as unknown as driverhealthcheckup;
      const actual = await saveDriverHealthCheckupAsAdmin(inputInstance, {
        vehicle_no: 'NEW',
      });
      expect(inputInstance.vehicle_no).toBe('NEW');
      expect(inputInstance.updated_by_admin_at).toBeInstanceOf(Date);
      expect(mockSave).toHaveBeenCalledWith({ silent: true });
      expect(actual).toBe(inputInstance);
    });
  });

  describe('updateDriverHealthCheckupAsAdmin', () => {
    it('should merge updated_by_admin_at and update with silent true', async () => {
      const inputWhere = { id: 115040 };
      const inputFields = { cpi_status: true };
      const actual = await updateDriverHealthCheckupAsAdmin(
        inputWhere,
        inputFields,
      );
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          cpi_status: true,
          updated_by_admin_at: expect.any(Date),
        }),
        { where: inputWhere, silent: true },
      );
      expect(actual).toEqual([1]);
    });
  });
});
