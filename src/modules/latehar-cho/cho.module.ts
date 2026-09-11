// src/cho/cho.module.ts
import { Module } from '@nestjs/common';
import { ChoService } from './cho.service';
import { ChoController } from './cho.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { ChoDuty } from '../../models/cho-duty.model';
import { User } from '../../models/User';
import { CenterGroup } from '../../models/CenterGroup';
import { Center } from '../../models/Center';
import { HttpModule } from '@nestjs/axios'; 

@Module({
    imports: [SequelizeModule.forFeature([ChoDuty, User, CenterGroup, Center]), HttpModule],
    providers: [ChoService],
    controllers: [ChoController],
})
export class ChoModule { }
