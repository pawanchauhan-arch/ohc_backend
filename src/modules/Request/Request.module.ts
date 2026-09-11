import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Request } from '../../models/Request';
import { RequestController } from './Request.controller';
import { RequestService } from './Request.service';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { Center } from 'src/models/Center';
import { CenterGroup } from 'src/models/CenterGroup';

@Module({
  imports: [SequelizeModule.forFeature([Request, DRIVERMASTER, Center, CenterGroup])],
  controllers: [RequestController],
  providers: [RequestService],
  exports: [RequestService],
})
export class RequestModule {}
