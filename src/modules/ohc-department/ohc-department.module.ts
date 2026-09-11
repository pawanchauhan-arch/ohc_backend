import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

import { DepartmentController } from './ohc-department.controller';
import { DepartmentService } from './ohc-department.service';

import { Department } from '../../models/department.model';
import { Center } from '../../models/Center';

@Module({
  imports: [SequelizeModule.forFeature([Department, Center])],

  controllers: [DepartmentController],

  providers: [DepartmentService],

  exports: [DepartmentService],
})
export class DepartmentModule {}
