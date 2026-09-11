import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { HealthCheckupModuleLMC } from 'src/modules/healthCheckup/health-checkup.module';
import { TestAccountModule } from '../test-account/test-account.module';
import { CetManagementModule } from '../cet/cet-management.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { JwtAdminGuardCenter } from 'src/modules/auth/guards/jwtCenter-auth.guard';
import { JwtAdminGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminOrCenterGuard } from 'src/modules/auth/guards/AdminOrCenterGuard';
import { SequelizeModule } from '@nestjs/sequelize';
@Module({
  
  imports: [
    SequelizeModule,
    HealthCheckupModuleLMC,
    TestAccountModule,
    CetManagementModule,
    AuthModule
  ],
  controllers: [DriverController],
  providers: [
    DriverService,
    AdminOrCenterGuard,
    JwtAdminGuard,
    JwtAdminGuardCenter,
  ],
  exports: [DriverService],
})
export class DriverModuleLMC {}
