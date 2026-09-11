import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { DRIVERMASTER } from 'src/models/DriverMaster';
import { CenterGroup } from 'src/models/CenterGroup';

@Module({
  imports: [SequelizeModule.forFeature([DRIVERMASTER, CenterGroup])], 
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
