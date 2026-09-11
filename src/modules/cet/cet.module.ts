import { Module } from '@nestjs/common';
import { DriverModuleLMC } from '../center/driver/driver.module';
import { CetManagementModule } from '../center/cet/cet-management.module';
import { CetControllerLMC } from './cet.controller';
import { AuthModule } from '../auth/auth.module';
@Module({
  imports: [DriverModuleLMC, CetManagementModule,AuthModule],
  controllers: [CetControllerLMC],
})
export class CetManagementModuleLMC {}
