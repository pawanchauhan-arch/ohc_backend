import {
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { CetAdminServiceLMC } from './cet-admin.service';
import { JwtAdminGuard } from '../../auth/guards/jwt-auth.guard';
import { SignatureUploadInterceptor } from 'src/middlewares/signature-upload.interceptor';
import { DriverService } from 'src/modules/center/driver/driver.service';
import { TestMasterServiceLMC } from 'src/modules/test-master/test-master.service';
import { PackageServiceLMC } from 'src/modules/package-lmc/package.service';
import {
  UploadInterceptor,
  UploadInterceptorFactory,
} from 'src/middlewares/upload.interceptor';
import { AdminContextInterceptor } from 'src/common/interceptors/admin-context.interceptor';

@UseInterceptors(AdminContextInterceptor)
@Controller('api/v1/admin')
@UseGuards(JwtAdminGuard)
export class CetAdminController {
  constructor(
    private readonly cetAdminServiceLMC: CetAdminServiceLMC,
    private readonly driverService: DriverService,
    private readonly testMasterService: TestMasterServiceLMC,
    private readonly packageService: PackageServiceLMC
  ) {}

  @Post('upload/file')
  @UseInterceptors(SignatureUploadInterceptor)
  uploadSignature(@Req() req: any, @Res() res: any) {
    return this.driverService.uploadSignature(req, res);
  }

  @Post('create/center')
  createCenter(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.createCenter(req, res);
  }

  @Post('view/center')
  viewCenter(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewCenter(req, res);
  }

  @Post('edit/center')
  centerEdit(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.centerEdit(req, res);
  }

  @Post('update/center/status')
  updateCenterStatus(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCenterStatus(req, res);
  }

  @Post('update/center')
  centerUpdate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.centerUpdate(req, res);
  }

  @Post('create-center-user') 
  createCenterUser(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.assignCenter(req, res);
  }

  @Post('center/user/view')
  centerUser(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.centerUser(req, res);
  }

  @Post('center/user/details')
  centerUserDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.centerUserDetails(req, res);
  }

  @Post('center/user/update')
  centerUserUpdate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.centerUserUpdate(req, res);
  }

  @Post('update/center/user/status')
  updateCenterUserStatus(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCenterUserStatus(req, res);
  }

  @Post('update/temperature')
  updateTemperature(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateTemperature(req, res);
  }

  @Post('update/spo2')
  updateSPO2(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateSPO2s(req, res);
  }

  @Post('update/random-blood-sugar')
  updateRandomBloodSugar(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateRandomBloodSugar(req, res);
  }

  @Post('update/pulse')
  updatePulse(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updatePulse(req, res);
  }

  @Post('update/pft')
  updatePFT(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updatePulmonaryfunctiontest(req, res);
  }

  @Post('update/haemoglobin')
  updateHaemoglobin(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateHaemoglobin(req, res);
  }

  @Post('update/cretenine')
  updateCretenine(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCretenine(req, res);
  }

  @Post('update/alchol')
  updateAlchol(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateAlcholtest(req, res);
  }

  @Post('update/hiv')
  updateHiv(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateHiv(req, res);
  }

  @Post('update/blood-group')
  updateBloodGroup(@Req() req: any, @Res() res: any) {
    return this.testMasterService.bloodGroup(req, res);
  }
  @Post('update/ecg')
  @UseInterceptors(UploadInterceptorFactory('file'))
  ecgUpdate(@Req() req: any, @Res() res: any) {
    return this.testMasterService.ecgUpdate(req, res);
  }

  @Post('update/blood-pressure')
  updateBloodPressure(@Req() req: any, @Res() res: any) {
    return this.testMasterService.bloodPressure(req, res);
  }

  @Post('update/bmi')
  updateBMI(@Req() req: any, @Res() res: any) {
    return this.testMasterService.bmiCheck(req, res);
  }

  @Post('update/cholesterol')
  updateCholesterol(@Req() req: any, @Res() res: any) {
    return this.testMasterService.cholesterolUpdate(req, res);
  }

  @Post('update/eye')
  updateEyeTest(@Req() req: any, @Res() res: any) {
    return this.testMasterService.updateEyeTest(req, res);
  }

  @Post('update/hearing')
  updateHearing(@Req() req: any, @Res() res: any) {
    return this.testMasterService.hearingTest(req, res);
  }

  @Post('view/temperature')
  viewTemperature(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewTemperature(req, res);
  }

  @Post('view/spo2')
  viewSPO2(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewSPO2(req, res);
  }

  @Post('view/random-blood-sugar')
  viewRandomBloodSugar(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewRandomBloodSugar(req, res);
  }

  @Post('view/pulse')
  viewPulse(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewPulse(req, res);
  }

  @Post('view/pft')
  viewPulmonaryFunctionTest(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewPulmonaryFunctionTest(req, res);
  }

  @Post('view/haemoglobin')
  viewHaemoglobin(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewHaemoglobin(req, res);
  }

  @Post('view/cretenine')
  viewCretenine(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewCretenine(req, res);
  }

  @Post('view/alchol')
  viewAlcholtest(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewAlcholtest(req, res);
  }

  @Post('view/hiv')
  viewHiv(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewHiv(req, res);
  }

  @Post('update/vision')
  VisionTestUpdate(@Req() req: any, @Res() res: any) {
    return this.testMasterService.VisionTestUpdate(req, res);
  }

  @Post('view/vision')
  VisionTestView(@Req() req: any, @Res() res: any) {
    return this.testMasterService.VisionTestView(req, res);
  }

  @Post('view/hearing')
  viewHearingtest(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewHearingtest(req, res);
  }

  @Post('view/blood-group')
  viewBloodgroup(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewBloodgroup(req, res);
  }

  @Post('view/ecg')
  viewECG(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewECG(req, res);
  }

  @Post('view/blood-pressure')
  viewBloodpressure(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewBloodpressure(req, res);
  }

  @Post('view/bmi')
  viewBMI(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewBMI(req, res);
  }

  @Post('view/cholesterol')
  viewCholesterol(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewCholesterol(req, res);
  }

  @Post('view/eye')
  viewEyeTest(@Req() req: any, @Res() res: any) {
    return this.testMasterService.viewEyeTest(req, res);
  }

  @Post('add/package')
  addPackage(@Req() req: any, @Res() res: any) {
    return this.packageService.addPackage(req, res);
  }

  @Post('package/list')
  listPackage(@Req() req: any, @Res() res: any) {
    return this.packageService.listPackage(req, res);
  }

  @Post('package/status/update')
  updatePackageStatus(@Req() req: any, @Res() res: any) {
    return this.packageService.updatePackageStatus(req, res);
  }

  @Post('addpackage/toCenter')
  addPackageTOCenter(@Req() req: any, @Res() res: any) {
    return this.packageService.addPackageTOCenter(req, res);
  }

  @Post('view/center/package')
  viewCenterPackage(@Req() req: any, @Res() res: any) {
    return this.packageService.viewCenterPackage(req, res);
  }

  @Post('update/center/package/status')
  updateCenterPackageStatus(@Req() req: any, @Res() res: any) {
    return this.packageService.updateCenterPackageStatus(req, res);
  }

  @Post('package/details')
  packageDetails(@Req() req: any, @Res() res: any) {
    return this.packageService.packageDetails(req, res);
  }

  @Post('package/update')
  packageUpdate(@Req() req: any, @Res() res: any) {
    return this.packageService.packageUpdate(req, res);
  }

  @Post('centerPackageDetails')
  centerPackageDetails(@Req() req: any, @Res() res: any) {
    return this.packageService.centerPackageDetails(req, res);
  }

  @Post('update/centerPackageDetails')
  centerPackageUpdate(@Req() req: any, @Res() res: any) {
    return this.packageService.centerPackageUpdate(req, res);
  }

  @Post('update/romberg')
  updateRomberg(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateRomberg(req, res);
  }

  @Post('view/romberg')
  viewRomberg(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewRomberg(req, res);
  }

  @Post('create/CET')
  createCET(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.createCET(req, res);
  }

  @Post('view/CET')
  viewCET(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewCET(req, res);
  }

  @Post('CET/details')
  viewCETDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewCETDetails(req, res);
  }

  @Post('CET/updateCET')
  updateCET(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCET(req, res);
  }

  @Post('CET/status/update')
  updateCETStatus(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCETStatus(req, res);
  }

  @Post('create-cet-user')
  assignCET(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.assignCET(req, res);
  }

  @Post('cet/user/view')
  cetUser(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.cetUser(req, res);
  }

  @Post('cet/user/details')
  cetUserDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.cetUserDetails(req, res);
  }

  @Post('cet/user/update')
  cetUserUpdate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.cetUserUpdate(req, res);
  }

  @Post('update/cet/user/status')
  updateCetUserStatus(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCetUserStatus(req, res);
  }

  // cet csv download
  @Post('cet/csv/download')
  downloadCsvCet(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.downloadCsvCet(req, res);
  }

  @Post('cet/csv/list')
  CsvCetList(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.CsvCetList(req, res);
  }

  @Post('create/Workforce/type')
  createWorkforceType(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.create(req, res);
  }

  @Post('view/Workforce/type')
  viewWorkforceType(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.view(req, res);
  }

  @Post('update/Workforce/type')
  updateWorkforceType(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.update(req, res);
  }

  @Post('Workforce/type/status/change')
  workforceTypeStatusChange(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.statusChange(req, res);
  }

  @Post('get/Workforce/type/byId')
  getWorkforceTypeById(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getById(req, res);
  }

  @Post('search/driverByID')
  searchDriverById(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.searchDriverById(req, res);
  }

  @Post('search/driverByHCnumber')
  searchDriverHealthRecordByHealthCard(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.searchDriverHealthRecordByHealthCard(
      req,
      res,
    );
  }

  @Post('searchDriver')
  searchDriver(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.searchDriver(req, res);
  }

  @Post('editVehicleNumber')
  editVehicleNumber(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.editVehicleNumber(req, res);
  }

  @Post('editShipmentNumber')
  editShipmentNumber(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.editShipmentNumber(req, res);
  }

  @Post('editGateEntryNumber')
  editGateEntryNumber(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.editGateEntryNumber(req, res);
  }

  @Post('editIdProofNumber')
  editIdProofNumber(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.editIdProofNumber(req, res);
  }

  @Post('testCount')
  getTestCountByCenter(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getTestCountByCenter(req, res);
  }

  @Post('testCountPerCenter')
  getTestCountPerCenter(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getTestCountPerCenter(req, res);
  }

  @Post('editCET')
  editCET(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.editCET(req, res);
  }

  @Post('cumulativeHealthAnalysis')
  cumulativeHealthAnalysis(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.cumulativeHealthAnalysis(req, res);
  }

  @Post('getCETTestCounts')
  getCETTestCounts(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getCETTestCounts(req, res);
  }

  @Post('getCETDriverCounts')
  getCETDriverCounts(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getCETDriverCounts(req, res);
  }

  @Post('downloadRecords')
  downloadHealthCheckupRecords(@Req() req: any, @Res() res: any) {
    return this.driverService.downloadHealthCheckupRecords(req, res);
  }

  // Center Groups Management

  @Post('create/center-group')
  createCenterGroup(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.createCenterGroup(req, res);
  }

  @Post('view/center-groups')
  viewCenterGroups(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewCenterGroups(req, res);
  }

  @Post('center-group/details')
  getCenterGroupDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getCenterGroupDetails(req, res);
  }

  @Post('update/center-group')
  updateCenterGroup(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCenterGroup(req, res);
  }

  @Post('center-group/status/update')
  updateCenterGroupStatus(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateCenterGroupStatus(req, res);
  }

  @Post('delete/center-group')
  deleteCenterGroup(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.deleteCenterGroup(req, res);
  }

  @Post('active/center-groups')
  getActiveCenterGroups(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getActiveCenterGroups(req, res);
  }

  @Post('center-groups/by-center-id')
  getCenterGroupsByCenterId(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.getCenterGroupsByCenterId(req, res);
  }

  @Post('create')
  adminCreate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.adminCreate(req, res);
  }

  @Post('user/list')
  userList(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.userList(req, res);
  }

  @Post('user/status/update')
  userStatusUpdate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.userStatusUpdate(req, res);
  }

  @Post('user/details')
  userDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.userDetails(req, res);
  }

  @Post('user/update')
  userUpdate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.userUpdate(req, res);
  }

  // -------- ROLE --------

  @Post('create/role')
  createRole(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.createRole(req, res);
  }

  @Post('view/role')
  viewRole(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewRole(req, res);
  }

  @Post('role/details')
  roleDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.roleDetails(req, res);
  }

  @Post('role/update')
  updateRole(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.updateRole(req, res);
  }

  // -------- PERMISSION --------

  @Post('create/user-permission')
  createPermission(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.createPermission(req, res);
  }

  @Post('view-permission')
  viewPermission(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.viewPermission(req, res);
  }

  @Post('permission-details')
  permissionDetails(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.permissionDetails(req, res);
  }

  @Post('permission-update')
  permissionUpdate(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.permissionUpdate(req, res);
  }

  @Post('user/logs')
  userLogs(@Req() req: any, @Res() res: any) {
    return this.cetAdminServiceLMC.userLogs(req, res);
  }
}
