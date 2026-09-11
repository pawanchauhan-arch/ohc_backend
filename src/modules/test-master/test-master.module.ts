import { Module } from '@nestjs/common';
import { TestMasterServiceLMC } from './test-master.service';

@Module({
  providers: [TestMasterServiceLMC],
  exports: [TestMasterServiceLMC],
})
export class TestMasterModuleLMC {}
