import { Module, OnModuleInit } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TestAccount } from '../../models/TestAccount';
import { TestAccountService } from './test-account.service';
import { TestAccountController } from './test-account.controller';
import { testAccountConfig } from '../../../config/envConfig';

@Module({
  imports: [SequelizeModule.forFeature([TestAccount])],
  providers: [TestAccountService],
  controllers: [TestAccountController],
  exports: [TestAccountService],
})
export class TestAccountModule implements OnModuleInit {
  constructor(private readonly testAccountService: TestAccountService) {}

  /**
   * Initialize the default test account when the module starts
   */
  async onModuleInit() {
    // Only create the default test account if test accounts are enabled
    if (testAccountConfig.enabled) {
      try {
        await this.testAccountService.createOrUpdateTestAccount(
          testAccountConfig.defaultTestPhone,
          testAccountConfig.defaultTestOtp,
          testAccountConfig.description,
        );
        console.log(`Initialized default test account: ${testAccountConfig.defaultTestPhone}`);
      } catch (error) {
        console.error('Error initializing default test account:', error);
      }
    }
  }
} 