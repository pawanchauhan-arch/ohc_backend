import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { InstavansParkflowService } from './instavans-parkflow.service';

@Module({
  imports: [HttpModule],
  providers: [InstavansParkflowService],
  exports: [InstavansParkflowService],
})
export class InstavansParkflowModule {}
