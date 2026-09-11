import { Module } from '@nestjs/common';
import { OpdServiceController } from './opdService.controller';
import { OpdService } from './opdService.service';

import { ServiceMaster } from "../../models/ServiceMaster";
import { ServiceTypeMaster } from "../../models/ServiceTypeMaster";
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
    imports: [
        SequelizeModule.forFeature([ServiceMaster, ServiceTypeMaster]),
    ],
    controllers: [OpdServiceController],
    providers: [OpdService],
})

export class OpdServiceModule { }