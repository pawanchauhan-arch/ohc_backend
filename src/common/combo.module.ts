import { Module } from '@nestjs/common';
import { ComboController } from './combo.controller';
import { ComboService } from './combo.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../models/User';
@Module({
    imports: [SequelizeModule.forFeature([User])],
    controllers: [ComboController],
    providers: [ComboService],
    exports: [ComboService],
})
export class ComboModule { }
