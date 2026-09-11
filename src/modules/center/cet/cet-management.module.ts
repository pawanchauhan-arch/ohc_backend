import { Module } from '@nestjs/common';
import { CetManagementService } from './cet-management.service';
import { CetListController } from './cet-list.controller';

@Module({
  controllers: [CetListController],
  providers: [CetManagementService],
  exports: [CetManagementService],
})
export class CetManagementModule {}
