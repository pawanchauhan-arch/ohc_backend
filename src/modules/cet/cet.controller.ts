import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { JwtCetGuard } from 'src/modules/auth/guards/jwt-cet-auth.guard';
import { DriverService } from 'src/modules/center/driver/driver.service';
import { CetManagementService } from 'src/modules/center/cet/cet-management.service';
import { CetContextInterceptor } from 'src/common/interceptors/cet-context.interceptor';

@UseInterceptors(CetContextInterceptor)
@Controller('api/v1/cet/')
export class CetControllerLMC {
  constructor(
    private readonly driverService: DriverService,
    private readonly cetManagementService: CetManagementService,
  ) {}


  @UseGuards(JwtCetGuard)
  @Post('health-checkup/history')
  async healthCheckupHistory(@Req() req: Request, @Res() res: Response) {
    return this.cetManagementService.healthCheckupHistory(req, res);
  }

  @Post('health-checkup/historyByid')
  async healthCheckupHistoryById(@Req() req: Request, @Res() res: Response) {
    return this.cetManagementService.healthCheckupHistoryById(req, res);
  }

  @UseGuards(JwtCetGuard)
  @Post('driver/list')
  async getDriverListCET(@Req() req: Request, @Res() res: Response) {
    return this.driverService.getDriverListCET(req, res);
  }

  @Post('driver/sendOTP')
  async sendOtp(@Req() req: Request, @Res() res: Response) {
    return this.driverService.sendOtp(req, res);
  }

  @Post('driver/verifyOTP')
  async verifyOtp(@Req() req: Request, @Res() res: Response) {
    return this.driverService.verifyOtp(req, res);
  }

  @UseGuards(JwtCetGuard)
  @Post('driver/checkPermission')
  async checkPermission(@Req() req: Request, @Res() res: Response) {
    return this.driverService.checkPermission(req, res);
  }

  @Post('driver/prevHealth')
  async downloadPrevHealthRecords(@Req() req: Request, @Res() res: Response) {
    return this.driverService.downloadPrevHealthRecords(req, res);
  }

  @Post('driver/update-permission')
  async updatePermission(@Req() req: Request, @Res() res: Response) {
    return this.driverService.updatePermission(req, res);
  }

  @Post('driver/update-employee-id')
  async updateEmployeeId(@Req() req: Request, @Res() res: Response) {
    return this.driverService.updateEmployeeId(req, res);
  }

  @Post('driver/update-employee-id-lmcID')
  async updateEmployeeIdByLMCID(@Req() req: Request, @Res() res: Response) {
    return this.driverService.updateEmployeeIdByLMCID(req, res);
  }

  @UseGuards(JwtCetGuard)
  @Post('driver/bulk-download')
  async downloadHealthCheckupRecords(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.driverService.downloadHealthCheckupRecords(req, res);
  }

  @UseGuards(JwtCetGuard)
  @Post('driver/workforce-bulk-download')
  async downloadDriverMasters(@Req() req: Request, @Res() res: Response) {
    return this.driverService.downloadDriverMasters(req, res);
  }

  @UseGuards(JwtCetGuard)
  @Post('driver/search')
  async searchDriver(@Req() req: Request, @Res() res: Response) {
    return this.driverService.searchDriver(req, res);
  }
}
