import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ABDMController } from './ABDM.controller';
import { ABDMService } from './ABDM.service';
import { ABDMToken } from 'src/models/abdm-token';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    HttpModule,
    SequelizeModule.forFeature([ABDMToken]), // Register ABDMToken model
  ],
  controllers: [ABDMController],
  providers: [ABDMService],
})
export class ABDMModule {}
