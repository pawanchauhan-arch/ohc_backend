import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Disease } from '../../models/disease';
import { DiseaseService } from './disease.service';
import { DiseaseController } from './disease.controller';

@Module({
    imports: [SequelizeModule.forFeature([Disease])],
    controllers: [DiseaseController],
    providers: [DiseaseService],
    exports: [DiseaseService], 
})
export class DiseaseModule { }
