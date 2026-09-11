import { Module } from '@nestjs/common';
import { DropdownsController } from './dropdowns.controller';
import { DropdownsService } from './dropdowns.service';

@Module({
  controllers: [DropdownsController],
  providers: [DropdownsService],
  exports: [DropdownsService],
})
export class DropdownsModule {} 