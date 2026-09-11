import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Organization } from '../../models/Organization';
import { OrganizationController } from './Organization.controller';
import { OrganizationService } from './Organization.service';
import { Center } from 'src/models/Center';

@Module({
  imports: [SequelizeModule.forFeature([Organization, Center])],
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
