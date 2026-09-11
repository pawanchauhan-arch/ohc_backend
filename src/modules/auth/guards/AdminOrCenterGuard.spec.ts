import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminOrCenterGuard } from './AdminOrCenterGuard';
import { JwtAdminGuard } from './jwt-auth.guard';
import { JwtAdminGuardCenter } from './jwtCenter-auth.guard';

describe('AdminOrCenterGuard', () => {
  let guard: AdminOrCenterGuard;
  const mockAdminGuard = { canActivate: jest.fn() };
  const mockCenterGuard = { canActivate: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    guard = new AdminOrCenterGuard(
      mockAdminGuard as unknown as JwtAdminGuard,
      mockCenterGuard as unknown as JwtAdminGuardCenter,
    );
  });

  const buildContext = (): ExecutionContext => {
    const request: Record<string, unknown> = {};
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as ExecutionContext;
  };

  it('should set isAdminCaller when admin guard passes', async () => {
    mockAdminGuard.canActivate.mockResolvedValue(true);
    const context = buildContext();
    const request = context.switchToHttp().getRequest();
    const actual = await guard.canActivate(context);
    expect(actual).toBe(true);
    expect(request['isAdminCaller']).toBe(true);
    expect(mockCenterGuard.canActivate).not.toHaveBeenCalled();
  });

  it('should not set isAdminCaller when center guard passes', async () => {
    mockAdminGuard.canActivate.mockRejectedValue(new Error('no admin token'));
    mockCenterGuard.canActivate.mockResolvedValue(true);
    const context = buildContext();
    const request = context.switchToHttp().getRequest();
    const actual = await guard.canActivate(context);
    expect(actual).toBe(true);
    expect(request['isAdminCaller']).toBeUndefined();
  });

  it('should throw when both guards fail', async () => {
    mockAdminGuard.canActivate.mockRejectedValue(new Error('no admin token'));
    mockCenterGuard.canActivate.mockRejectedValue(new Error('no center token'));
    const context = buildContext();
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
