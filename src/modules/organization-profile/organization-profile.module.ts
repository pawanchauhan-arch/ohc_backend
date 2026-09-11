import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { OrganizationProfileController } from './organization-profile.controller';
import { OrganizationProfileService } from './organization-profile.service';

import { OrganizationProfile } from '../../models/OrganizationProfile';
import { Tenant } from '../../models/Tenant';
import { Center } from '../../models/Center';
@Module({
  imports: [
    SequelizeModule.forFeature([
      OrganizationProfile,
      Tenant,
      Center,
    ]),
  ],

  controllers: [
    OrganizationProfileController,
  ],

  providers: [
    OrganizationProfileService,
  ],

  exports: [
    OrganizationProfileService,
  ],
})
export class OrganizationProfileModule {}