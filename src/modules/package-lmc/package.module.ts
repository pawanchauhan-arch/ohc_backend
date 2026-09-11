import { Module } from '@nestjs/common';
import { PackageServiceLMC } from './package.service';

@Module({
  providers: [PackageServiceLMC],
  exports: [PackageServiceLMC],
})
export class PackageModuleLMC {}
