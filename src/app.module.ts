import {
  Module,
  OnModuleInit,
  MiddlewareConsumer,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DriverMasterModule } from './modules/DriverMaster/DriverMaster.module';
import { OtpModule } from './modules/otp/otp.module';
import { DriverHealthCheckupModule } from './modules/DriverHealthCheckup/DriverHealthCheckup.module';
import { DRIVERMASTER } from './models/DriverMaster';
import { driverhealthcheckup } from './models/DriverHealthCheckup';
import { Otp } from './models/OTP';
import { Center } from './models/Center';
import { CETMANAGEMENT } from './models/CetManagement';
import { Doctor } from './models/Doctor';
import { User } from './models/User';
import { DRIVERFAMILYHISTORY } from './models/DriverFamilyHistory';
import { Permission } from './models/Permissions';
import { Permissionmetadata } from './models/PermissionsMetaData';
import { Role } from './models/Role';
import { DRIVERMASTERPERSONAL } from './models/DriverMasterPersonal';
import { CenterUser } from './models/CenterUser';
import { Cetuser } from './models/CetUser';
import { CetContact } from './models/CetContact';
import { Consultation } from './models/Consultation';
import { ConsultationModule } from './modules/Consultation/Consultation.module';
import { Prescription } from './models/Prescription';
import { PrescriptionMedicine } from './models/PrescriptionMedicine';
import { PrescriptionMedicineModule } from './modules/PrescriptionMedicine/PrescriptionMedicine.module';
import { PrescriptionModule } from './modules/Prescription/Prescription.module';
import { Banner } from './models/Banner';
import { BannersModule } from './modules/Banner/Banner.module';
import { ABDMToken } from './models/abdm-token';
import { ABDMModule } from './modules/ABDM/ABDM.module';
import { Request } from './models/Request';
import { RequestModule } from './modules/Request/Request.module';
import { DoctorModule } from './modules/Doctor/Doctor.module';
import { FcmModule } from './modules/fcm/fcm.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { FcmToken } from './models/fcm-token.model';
import { Notification } from './models/notification.model';
import { VersionModule } from './modules/version/version.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { SchedulerService } from './modules/scheduler/scheduler.service';
import { TestAccountModule } from './modules/test-account/test-account.module';
import { TestAccount } from './models/TestAccount';
import { PrescriptionEditLogsModule } from './modules/PrescriptionEditLogs/PrescriptionEditLogs.module';
import { ConsultationRecording } from './models/consultationRecording';
import { ConsultationRecordingModule } from './modules/consultationRecording/consultationRecording.module';
import { DropdownsModule } from './modules/dropdowns/dropdowns.module';
// Health Concern Alert System imports
import { HealthAnalysisModule } from './modules/health-analysis/health-analysis.module';
import { HealthConcernsModule } from './modules/health-concerns/health-concerns.module';
import { SpocManagementModule } from './modules/spoc-management/spoc-management.module';
import { CommunicationModule } from './modules/communication/communication.module';
import { HealthConcern } from './models/HealthConcern';
import { CenterGroup } from './models/CenterGroup';
// Migration imports
import { MigrationLog } from './modules/migration/models/migration-log.model';
import { BackupLog } from './modules/migration/models/backup-log.model';
import { MigrationModule } from './modules/migration/migration.module';
import { IncrementalMigrationService } from './modules/migration/services/incremental-migration.service';
// Health Records Migration imports
import { HealthRecordsMigrationModule } from './modules/health-records-migration/health-records-migration.module';
import { CampList } from './models/CampList';
import { CampListItem } from './models/CampListItem';
import { CampItemBarcode } from './models/CampItemBarcode';
import { CampModule } from './modules/Camp/camp.module';
import { PhlebotomistModule } from './modules/phlebotomist/phlebotomist.module';
import { CamplistitemModule } from './modules/camplistitem/camplistitem.module';
import { JslIntegrationModule } from './modules/jsl-integration/jsl-integration.module';
import { JslShipmentDetailModel } from './models/jsl-shipment-detail.model';
import { Organization } from './models/Organization';
import { OrganizationCenter } from './models/Organization_center';
import { SamplifyModule } from './modules/Samplify/samplify.module';
import { MobilabBooking } from './models/MobilabTestResult';
import { MobiLabModule } from './modules/MobiLab/mobilab.module';
import { CorporateModule } from './modules/Corporate/corporate.module';
import { CenterModule } from './modules/center/center.module';
import { EmailRecord } from './models/EmailRecord';
import { ScheduleModule } from '@nestjs/schedule';
import {
  Spo2Test,
  BloodPressureTest,
  TemperatureTest,
  PulseTest,
  BmiTest,
  RandomBloodSugarTest,
  HaemoglobinTest,
  AlcoholTest,
  EcgTest,
  VisionTest,
  RombergTest,
  PulmonaryFunctionTest,
  HivTest,
  EyeTest,
} from './models/health-tests';
import { PatientModule } from './modules/patient/patient.module';
import { HealthModule } from './modules/ViewDriverHealth/health.module';
import { HealthModule as ObservabilityHealthModule } from './health/health.module';
import { OpdModule } from './modules/opd/opd.module';
import { OpdServiceModule } from './modules/opdServices/opdService.module';
import { DiseaseModule } from './modules/disease/disease.module';
import { Disease } from './models/disease';
import { SearchModule } from './modules/SearchDriver/search.module';
import { ChoModule } from './modules/latehar-cho/cho.module';
import { ChoDuty } from './models/cho-duty.model';
import { UserModule } from './modules/user/user.module';

import { Cbc } from './models/health-tests/cbc.model';
import { Biochemistry } from './models/health-tests/biochemistry.model';
import { LipidProfile } from './models/health-tests/lipid_profile.model';
import { Kft } from './models/health-tests/kft.model';
import { Lft } from './models/health-tests/lft.model';
import { LabTestSetting } from './models/health-tests/LabTestSetting';
import { LabTestModule } from './modules/LabTestSetting/labTest.module';

import { LateharSyncModule } from './modules/latehar-sync/latehar-sync.module';
import { DoctorModuleLMC } from './modules/admin/doctor/doctor.module';
import { Packagemanagment } from 'src/models/packagemanagment.model';
import { Centerpackage } from 'src/models/centerpackage.model';
import { Bloodgroup } from 'src/models/bloodgroup.model';
import { Bloodpressure } from 'src/models/bloodpressure.model';
import { Pulmonaryfunctiontest } from 'src/models/pulmonaryfunctiontest.model';
import { BMI } from 'src/models/bmi.model';
import { CHOLESTEROL } from 'src/models/cholesterol.model';
import { Cretenine } from 'src/models/cretenine.model';
import { ECG } from 'src/models/ecg.model';
import { Haemoglobin } from 'src/models/haemoglobin.model';
import { Hearingtest } from 'src/models/hearingtest.model';
import { Hiv } from 'src/models/hiv.model';
import { Pulse } from 'src/models/pulse.model';
import { RandomBloodSugar } from 'src/models/random-blood-sugar.model';
import { SPO2 } from 'src/models/spo2.model';
import { Temperature } from 'src/models/temperature.model';
import { Romberg } from 'src/models/romberg.model';
import { Vision } from 'src/models/vision.model';
import { ViewHistoryPermission } from 'src/models/view-history-permission.model';
import { DriverModuleLMC } from './modules/center/driver/driver.module';
import { HealthCheckupModuleLMC } from './modules/healthCheckup/health-checkup.module';
import { VideoCategoryReference } from './models/video-category-reference.model';
import { Workforcetype } from './models/workforcetype.model';
import { Eyetest } from './models/eyetest.model';
import { Alcholtest } from './models/alcholtest.model';
import { CetManagementModuleLMC } from './modules/cet/cet.module';
import { TestMasterModuleLMC } from './modules/test-master/test-master.module';
import { CetAdminModuleLMC } from './modules/admin/cet/cet-admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { PackageModuleLMC } from './modules/package-lmc/package.module';
import { UserLog } from './models/userlog.model';
import { LocationModule } from './modules/location/location.module';
import { ComboModule } from './common/combo.module';
import { InstavansParkflowModule } from './modules/instavans-parkflow/instavans-parkflow.module';
import { singletonJobsEnabled } from 'config/envConfig';
import { ObservabilityModule } from './observability/observability.module';
import { RequestLoggerMiddleware } from './observability/middleware/request-logger.middleware';
import { CorrelationIdMiddleware } from './observability/middleware/correlation-id.middleware';
import { MetricsMiddleware } from './observability/middleware/metrics.middleware';
import { MedicineInventoryModule } from './modules/MedicineInventory/medicine-inventory';
import { PicasoItemDetailModel } from './models/MedicineItemDetails';
import { PicasoItemTypeModel } from './models/MedicineItemTypes';
import { PicasoAdviceList } from './models/AdviceList';
import { PicasoPatientConsultingSheetDetails } from './models/PatientConsultingSheetdetails';
import { PicasoidPrescriptionModule } from './modules/PicasoidPrescription/picasoid-prescription';
import { PicasoOpdPhrgBillHeaderModel } from './models/MedicineOpdBillHeader';
import { PicasoOpdPhrfBillFooterModel } from './models/MedicineOpdBillFooter';
import { Attendance } from './models/attendace.model';
import { Holiday } from './models/holiday.model';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { OhcAppointmentModule } from './modules/OhcAppointment/ohc_appointment.module';
import { OhcDoctorAssessmentModule } from './modules/OhcDoctorAssessment/ohc_doctorAssessment.module';
import { OhcLabModule } from './modules/OHCLabInvestigation/ohc_lab.module';
import { OhcMedicalHistoryModule } from './modules/OhcMedicalHistory/ohc_medicalhistory.module';
import { OhcRadiologyModule } from './modules/OhcRadiology/ohc_radiology.module';
import { OhcFitnessModule } from './modules/OhcFitness/ohc_fitness.module';
import { OhcClinicalExaminationModule } from './modules/OHCClinicalExamination/ohc_clinicalexamination.module';
import { OHCClinicalExamination } from './models/OHCClinicalExamination.model';
import { OHCDoctorAssessment } from './models/OHCDoctorAssessment.model';
import { OHCFitnessCertificate } from './models/OHCFitnessCertificate.model';
import { OHCLabInvestigation } from './models/OHCLabInvestigation.model';
import { OHCMedicalHistory } from './models/OHCMedicalHistory.model';
import { OHCRadiologyTest } from './models/OHCRadiologyTest.model';
import { OHCLabTestResult } from './models/OHCLabTestResult.model';
import { CertificateTemplate } from './models/OhcCertificateTemplate.model';
import { OrganizationProfileModule } from './modules/organization-profile/organization-profile.module';
import { OrganizationProfile } from './models/OrganizationProfile';
import { OhcVitalsModule } from './modules/ohc-vitals/ohc-vitals.module';
import { Tenant } from './models/Tenant';
import { CampOpdModule } from './modules/campopd/campopd.module';
import { PicasoOpdCampBillFooter } from './models/CampOpdBillingDetails';
import { PicasoOpdCampBillHeader } from './models/CampOpdBilling';
import { PicasoOpdPhrfcampBillFooterModel } from './models/MedicineOpdcampBillFooter';
import { PicasoOpdPhrgcampBillHeaderModel } from './models/MedicineOpdcampBillHeader';
import { PicasoOpdDailyPatientListModel } from './models/PicasoOpdDailyPatientList';
import { PharmacyRevenueModule } from './modules/pharmacy-revenue/pharmacy-revenue.module';
import { SpectacleRevenueModule } from './modules/spectacle-revenue/spectacle-revenue.module';
import { PackagemanagementModule } from './modules/PackageManagement/packagemanagement.module';
import { PicasoCampAdviceList } from './models/CampAdviceList';
import { PicasoPatientCampConsultingSheetDetails } from './models/PatientCampConsultingSheetdetails';
import { PicasoidCampPrescriptionModule } from './modules/PicasoidCampPrescription/picasoid-prescription-camp';
import { DepartmentModule } from './modules/ohc-department/ohc-department.module';
import { Department } from './models/department.model';
import { DesignationModule } from './modules/ohc-designation/ohc-designation.module';
import { Designation } from './models/designation.model';
import { BulkUploadWorkersModule } from './modules/BulkUploadWorkers/bulk-upload.module';
import {AmbulancesModule} from './modules/ambulances/ambulance-services.module';
import {Ambulance} from './models/ambulance.model';
import {AmbulanceService} from './models/ambulance-service.model';
import {AmbulanceServicesModule} from './modules/ambulance-service/ambulance-services.module';

const isStaging = process.env.isStaging;
let db;
if (isStaging === '1') {
  console.log('Staging mode');
  db = {
    dialect: 'postgres',
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Use only in development
      },
    },
  };
} else {
  db = {
    dialect: 'postgres',
    database: process.env.DATABASE_NAME,

    replication: {
      write: {
        host: process.env.WRITE_DB_HOST,
        username: process.env.WRITE_DB_USER,
        password: process.env.WRITE_DB_PASSWORD,
      },
      read: Array(3)
        .fill(null)
        .map(() => ({
          host: process.env.READ_DB1_HOST,
          username: process.env.READ_DB1_USER,
          password: process.env.READ_DB1_PASSWORD,
        })),
    },

    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Use only in development
      },
    },
  };
}

@Module({
  imports: [
    ObservabilityModule,
    ScheduleModule.forRoot(),
    SequelizeModule.forRoot({
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false, // Use only in development
        },
      },
      models: [
        DRIVERMASTER,
        driverhealthcheckup,
        Otp,
        Center,
        CETMANAGEMENT,
        Doctor,
        User,
        DRIVERFAMILYHISTORY,
        Permission,
        Permissionmetadata,
        Role,
        DRIVERMASTERPERSONAL,
        CenterUser,
        Cetuser,
        CetContact,
        Prescription,
        Consultation,
        PrescriptionMedicine,
        Banner,
        ABDMToken,
        Request,
        FcmToken,
        Notification,
        TestAccount,
        ConsultationRecording,
        HealthConcern,
        CenterGroup,
        MigrationLog,
        BackupLog,
        // Health test models
        Spo2Test,
        BloodPressureTest,
        TemperatureTest,
        PulseTest,
        BmiTest,
        RandomBloodSugarTest,
        AlcoholTest,
        EcgTest,
        VisionTest,
        RombergTest,
        PulmonaryFunctionTest,
        HivTest,
        EyeTest,
        CampList,
        CampListItem,
        CampItemBarcode,
        Organization,
        OrganizationCenter,
        JslShipmentDetailModel,
        MobilabBooking,
        ChoDuty,
        Cbc,
        Biochemistry,
        LipidProfile,
        Kft,
        Lft,
        LabTestSetting,
        Packagemanagment,
        Centerpackage,
        Bloodgroup,
        Bloodpressure,
        Pulmonaryfunctiontest,
        BMI,
        CHOLESTEROL,
        Cretenine,
        ECG,
        Haemoglobin,
        HaemoglobinTest,
        Hearingtest,
        Hiv,
        Pulse,
        RandomBloodSugar,
        SPO2,
        Temperature,
        Romberg,
        ViewHistoryPermission,
        Vision,
        VideoCategoryReference,
        Workforcetype,
        Eyetest,
        Alcholtest,
        UserLog,
        ChoDuty,
        Disease,
        PicasoItemTypeModel,
        PicasoItemDetailModel,
        PicasoAdviceList,
        PicasoPatientConsultingSheetDetails,
        PicasoOpdPhrgBillHeaderModel,
        PicasoOpdPhrfBillFooterModel,
        Attendance,
        Holiday,
        OHCClinicalExamination,
        OHCDoctorAssessment,
        OHCFitnessCertificate,
        OHCMedicalHistory,
        OHCRadiologyTest,
        OHCLabTestResult,
        OHCLabInvestigation,
        CertificateTemplate,
        OrganizationProfile,
        Tenant,
        PicasoOpdCampBillFooter,
        PicasoOpdCampBillHeader,
        PicasoOpdPhrgcampBillHeaderModel,
        PicasoOpdPhrfcampBillFooterModel,
        PicasoOpdDailyPatientListModel,
        PicasoCampAdviceList,
        PicasoPatientCampConsultingSheetDetails,
        Department,
        Designation,
        Ambulance,
        AmbulanceService,
      ],
      autoLoadModels: true,
      synchronize: false, // Consider disabling in production
    }),
    DriverMasterModule,
    OtpModule,
    DriverHealthCheckupModule,
    ConsultationModule,
    BannersModule,
    ABDMModule,
    RequestModule,
    PrescriptionModule,
    PrescriptionMedicineModule,
    DoctorModule,
    FcmModule,
    NotificationsModule,
    VersionModule,
    SchedulerModule,
    TestAccountModule,
    PrescriptionEditLogsModule,
    ConsultationRecordingModule,
    DropdownsModule,
    HealthAnalysisModule,
    HealthConcernsModule,
    SpocManagementModule,
    CommunicationModule,
    MigrationModule,
    HealthRecordsMigrationModule,
    CampModule,
    PhlebotomistModule,
    CamplistitemModule,
    JslIntegrationModule,
    HealthModule,
    ObservabilityHealthModule,
    SearchModule,
    SamplifyModule,
    MobiLabModule,
    ChoModule,
    UserModule,
    LateharSyncModule,
    DoctorModuleLMC,
    DriverModuleLMC,
    HealthCheckupModuleLMC,
    CetManagementModuleLMC,
    TestMasterModuleLMC,
    CetAdminModuleLMC,
    AuthModule,
    PackageModuleLMC,
    CorporateModule,
    InstavansParkflowModule,
    LabTestModule,
    CenterModule,
    ComboModule,
    PatientModule,
    OpdModule,
    OpdServiceModule,
    DiseaseModule,
    LocationModule,
    ComboModule,
    MedicineInventoryModule,
    PicasoidPrescriptionModule,
    AttendanceModule,
    OhcAppointmentModule,
    OhcDoctorAssessmentModule,
    OhcLabModule,
    OhcMedicalHistoryModule,
    OhcRadiologyModule,
    OhcFitnessModule,
    OhcClinicalExaminationModule,
    OhcVitalsModule,
    OrganizationProfileModule,
    CampOpdModule,
    PharmacyRevenueModule,
    SpectacleRevenueModule,
    PackagemanagementModule,
    PicasoidCampPrescriptionModule,
    DepartmentModule,
    DesignationModule,
    BulkUploadWorkersModule,
    AmbulancesModule,
    AmbulanceServicesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements OnModuleInit, NestModule {
  constructor(
    private readonly schedulerService: SchedulerService,
    private readonly incrementalMigrationService: IncrementalMigrationService,
  ) {}

  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        CorrelationIdMiddleware,
        MetricsMiddleware,
        RequestLoggerMiddleware,
      )
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }

  /**
   * Initialize scheduled tasks when the application starts
   */
  onModuleInit() {
    if (singletonJobsEnabled) {
      this.schedulerService.initScheduledTasks();
    }
    const isIncrementalMigrationScheduleEnabled =
      process.env.INCREMENTAL_MIGRATION_SCHEDULE_ENABLED === 'true';
    if (singletonJobsEnabled && isIncrementalMigrationScheduleEnabled) {
      this.incrementalMigrationService.initScheduledTasks();
    }
  }
}
