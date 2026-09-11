import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { DRIVERMASTER} from '../../models/DriverMaster';
import { DriverHealthCheckupController } from './DriverHealthCheckup.controller';
import { DriverHealthCheckupService } from './DriverHealthCheckup.service';
import { DriverHealthStats } from 'src/models/DriverHealthStats';
import { Doctor } from 'src/models/Doctor';
import { CETMANAGEMENT } from 'src/models/CetManagement';
import { Center } from 'src/models/Center';
import { CenterUser } from 'src/models/CenterUser';
import { User } from 'src/models/User';
import { Corporate } from 'src/models/corporate';
import { CampListItem } from '../../models/CampListItem';


@Module({
  imports: [
    SequelizeModule.forFeature([driverhealthcheckup, DRIVERMASTER, DriverHealthStats, Doctor, CETMANAGEMENT, Center, CenterUser, User, Corporate, CampListItem]), // Register DriverHealthCheckup and DriverMaster models
  ],
  controllers: [DriverHealthCheckupController], // Register DriverHealthCheckup controller
  providers: [DriverHealthCheckupService], // Register DriverHealthCheckup service
})
export class DriverHealthCheckupModule {}
