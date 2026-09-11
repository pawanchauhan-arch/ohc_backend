import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Delete,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DriverService } from './driver.service';
import { AdminOrCenterGuard } from '../../auth/guards/AdminOrCenterGuard';
import { HealthCheckupService } from 'src/modules/healthCheckup/health-checkup.service';
import { TestAccountService } from '../test-account/test-account.service';
import { CetManagementService } from '../cet/cet-management.service';
import { SignatureUploadInterceptor } from 'src/middlewares/signature-upload.interceptor';
import { AdminCenterContextInterceptor } from 'src/common/interceptors/center-context.interceptor';
const isTestAccountSetupOpen =
  process.env.ALLOW_TEST_ACCOUNT_SETUP && process.env.NODE_ENV !== 'production';
const testAccountMiddleware = isTestAccountSetupOpen
  ? (req, res, next) => {
      console.warn(
        'WARNING: Test account management endpoints are temporarily unprotected via ALLOW_TEST_ACCOUNT_SETUP flag.',
      );
      next();
    }
  : AdminOrCenterGuard;
@UseInterceptors(AdminCenterContextInterceptor)
@Controller('api/v1/center')
export class DriverController {
  constructor(
    private readonly driverService: DriverService,
    private readonly healthCheckupService: HealthCheckupService,
    private readonly testAccountService: TestAccountService,
    private readonly cetManagementService: CetManagementService,
  ) {}

  /* ================= DRIVER ================= */

  @Post('driver/create')
  @UseGuards(AdminOrCenterGuard)
  // @UseInterceptors(FileInterceptor('files')) // uploadImagesToS3
  createDriver(@Req() req: Request, @Res() res: Response) {
    return this.driverService.createDriver(req, res);
  }

  @Post('driver/list')
  @UseGuards(AdminOrCenterGuard)
  getDriverList(@Req() req: Request, @Res() res: Response) {
    return this.driverService.getDriverList(req, res);
  }

  @Post('driver/details')
  @UseGuards(AdminOrCenterGuard)
  getDriverDetails(@Req() req: Request, @Res() res: Response) {
    return this.driverService.getDriverDetails(req, res);
  }

  @Post('driver/update')
  @UseGuards(AdminOrCenterGuard)
  updateDriver(@Req() req: Request, @Res() res: Response) {
    return this.driverService.updateDriver(req, res);
  }

  @Post('driver/search')
  @UseGuards(AdminOrCenterGuard)
  searchDriver(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.driverService.searchDriver(req, res);
  }

  @Post('driver/search/bynumber')
  @UseGuards(AdminOrCenterGuard)
  searchDriverByNumberOrID(@Req() req: Request, @Res() res: Response) {
    return this.driverService.searchDriverByNumberorID(req, res);
  }

  /* ================= OTP ================= */

  @Post('driver/send/otp')
  sendOtp(@Req() req: Request, @Res() res: Response) {
    return this.driverService.sendOtp(req, res);
  }

  @Post('driver/send/otp2')
  sendOtp2(@Req() req: Request, @Res() res: Response) {
    return this.driverService.sendOtp2(req, res);
  }

  @Post('driver/send/otp/whatsapp')
  whatsappOtp(@Req() req: Request, @Res() res: Response) {
    return this.driverService.whatsappOtp(req, res);
  }

  @Post('driver/verify/otp')
  @UseGuards(AdminOrCenterGuard)
  verifyOtp(@Req() req: Request, @Res() res: Response) {
    return this.driverService.verifyOtp(req, res);
  }

  /* ================= PERSONAL HISTORY ================= */

  @Post('driver/personal/history/create')
  @UseGuards(AdminOrCenterGuard)
  createPersonalHistory(@Req() req: Request, @Res() res: Response) {
    return this.driverService.createDriverPersonalData(req, res);
  }

  @Post('driver/personal/history/view')
  @UseGuards(AdminOrCenterGuard)
  viewPersonalHistory(@Req() req: Request, @Res() res: Response) {
    return this.driverService.driverPersonalDataView(req, res);
  }

  @Post('driver/personal/history/details')
  @UseGuards(AdminOrCenterGuard)
  personalHistoryDetails(@Req() req: Request, @Res() res: Response) {
    return this.driverService.driverPersonalDetails(req, res);
  }

  @Post('driver/personal/history/update')
  @UseGuards(AdminOrCenterGuard)
  updatePersonalHistory(@Req() req: Request, @Res() res: Response) {
    return this.driverService.driverPersonalUpdate(req, res);
  }

  /* ================= FAMILY HISTORY ================= */

  @Post('driver/family/history/create')
  @UseGuards(AdminOrCenterGuard)
  createFamilyHistory(@Req() req: Request, @Res() res: Response) {
    return this.driverService.createDriverFamilyData(req, res);
  }

  @Post('driver/family/history/list')
  @UseGuards(AdminOrCenterGuard)
  familyHistoryList(@Req() req: Request, @Res() res: Response) {
    return this.driverService.driverFamilyList(req, res);
  }

  @Post('driver/family/history/details')
  @UseGuards(AdminOrCenterGuard)
  familyHistoryDetails(@Req() req: Request, @Res() res: Response) {
    return this.driverService.driverFamilyDetails(req, res);
  }

  @Post('driver/family/history/update')
  @UseGuards(AdminOrCenterGuard)
  updateFamilyHistory(@Req() req: Request, @Res() res: Response) {
    return this.driverService.driverFamilyUpdate(req, res);
  }

  /* ================= FILE UPLOAD ================= */

  @Post('upload/file')
  @UseInterceptors(SignatureUploadInterceptor)
  uploadSignature(@Req() req: Request, @Res() res: Response) {
    return this.driverService.uploadSignature(req, res);
  }

  /* ================= HEALTH CHECKUP ================= */

  @Post('driver/create/health-checkup/step-1')
  @UseGuards(AdminOrCenterGuard)
  createHealthStep1(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.createHealthData(req, res);
  }

  @Post('driver/create/health-checkup/step-2')
  @UseGuards(AdminOrCenterGuard)
  createHealthStep2(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.createHealthDataStep2(req, res);
  }

  @Get('driver/get/health-checkup/concerns')
  @UseGuards(AdminOrCenterGuard)
  getHealthConcerns(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.getHealthCheckupConcerns(req, res);
  }

  @Post('driver/view/health-checkup')
  @UseGuards(AdminOrCenterGuard)
  viewHealthData(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.viewHealthData(req, res);
  }

  @Post('driver/health-checkup/details')
  @UseGuards(AdminOrCenterGuard)
  detailsHealthData(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.detailsHealthData(req, res);
  }

  @Post('driver/health-checkup/history')
  @UseGuards(AdminOrCenterGuard)
  healthHistory(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.driverHealthHistory(req, res);
  }

  @Post('driver/health-checkup/download')
  healthReportDownload(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.driverHealthReportDownload(req, res);
  }

  @Post('driver/doctor/list')
  @UseGuards(AdminOrCenterGuard)
  driverDoctorList(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.driverDoctorList(req, res);
  }

  @Post('driver/update/updateHealthDataById')
  @UseGuards(AdminOrCenterGuard)
  updateHealthDataById(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.updateHealthDataById(req, res);
  }

  /* ================= PACKAGE ================= */

  @Post('driver/package/list')
  @UseGuards(AdminOrCenterGuard)
  packageList(@Req() req: Request, @Res() res: Response) {
    return this.driverService.packageList(req, res);
  }

  @Post('driver/package/list/wise/unit')
  @UseGuards(AdminOrCenterGuard)
  packageListUnit(@Req() req: Request, @Res() res: Response) {
    return this.driverService.packageListUnit(req, res);
  }

  /* ================= CENTER ================= */

  @Post('get-center-id')
  @UseGuards(AdminOrCenterGuard)
  getCenterId(@Req() req: Request, @Res() res: Response) {
    return this.driverService.getCenterId(req, res);
  }

  /* ================= VEHICLE ================= */

  @Post('driver/update/vehicleNumber')
  @UseGuards(AdminOrCenterGuard)
  updateVehicleNumber(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.editVehicleNumber(req, res);
  }

  @Post('driver/view/Workforce/type')
  @UseGuards(AdminOrCenterGuard)
  workforceType(@Req() req: Request, @Res() res: Response) {
    return this.healthCheckupService.view(req, res);
  }

  @Post('create/CET')
  @UseGuards(AdminOrCenterGuard)
  createCET(@Req() req: Request, @Res() res: Response) {
    return this.cetManagementService.createCET(req, res);
  }

  @Post('view/CET')
  @UseGuards(AdminOrCenterGuard)
  viewCET(@Req() req: Request, @Res() res: Response) {
    return this.cetManagementService.viewCET(req, res);
  }

  @Post('CET/details')
  @UseGuards(AdminOrCenterGuard)
  viewCETDetails(@Req() req: Request, @Res() res: Response) {
    return this.cetManagementService.viewCETDetails(req, res);
  }

  @Post('CET/updateCET')
  @UseGuards(AdminOrCenterGuard)
  updateCET(@Req() req: Request, @Res() res: Response) {
    return this.cetManagementService.updateCET(req, res);
  }

  @Post('test-accounts-email')
  @UseGuards(testAccountMiddleware)
  createOrUpdateTestAccount(@Req() req: Request, @Res() res: Response) {
    return this.testAccountService.createOrUpdateTestAccount(req, res);
  }

  @Get('test-accounts-email')
  @UseGuards(testAccountMiddleware)
  getAllTestAccounts(@Req() req: Request, @Res() res: Response) {
    return this.testAccountService.getAllTestAccounts(req, res);
  }

  @Get('test-accounts-email/check/:email')
  @UseGuards(testAccountMiddleware)
  isTestAccount(@Req() req: Request, @Res() res: Response) {
    return this.testAccountService.isTestAccount(req, res);
  }

  @Get('test-accounts-email/:email')
  @UseGuards(testAccountMiddleware)
  getTestAccount(@Req() req: Request, @Res() res: Response) {
    return this.testAccountService.getTestAccount(req, res);
  }

  @Delete('test-accounts-email/:email')
  @UseGuards(testAccountMiddleware)
  deleteTestAccount(@Req() req: Request, @Res() res: Response) {
    return this.testAccountService.deleteTestAccount(req, res);
  }
}
