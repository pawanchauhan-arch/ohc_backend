import { Module } from '@nestjs/common';
import { CetAdminServiceLMC } from './cet-admin.service';
import { DriverModuleLMC } from 'src/modules/center/driver/driver.module';
import { CetAdminController } from './cet-admin.controller';
import { TestMasterModuleLMC } from 'src/modules/test-master/test-master.module';
import { PackageModuleLMC } from 'src/modules/package-lmc/package.module';
import { AuthModule } from 'src/modules/auth/auth.module';
@Module({
  imports: [DriverModuleLMC, TestMasterModuleLMC, PackageModuleLMC, AuthModule],
  providers: [CetAdminServiceLMC],
  exports: [CetAdminServiceLMC],
  controllers: [CetAdminController],
})
export class CetAdminModuleLMC {}
