import { Module } from '@nestjs/common';
import { TestAccountService } from './test-account.service';

@Module({
  providers: [TestAccountService],
  exports: [TestAccountService],
})
export class TestAccountModule {}
