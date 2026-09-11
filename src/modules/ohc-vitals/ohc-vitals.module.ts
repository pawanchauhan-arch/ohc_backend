import { Module } from '@nestjs/common';
import { OhcVitalsService } from './ohc-vitals.service';
import { OhcVitalsController } from './ohc-vitals.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { OhcVitals } from 'src/models/ohcVitals.model';

@Module({
    imports: [SequelizeModule.forFeature([OhcVitals])],
  providers: [OhcVitalsService],
  controllers: [OhcVitalsController],
  exports: [OhcVitalsService],
})
export class OhcVitalsModule {}
