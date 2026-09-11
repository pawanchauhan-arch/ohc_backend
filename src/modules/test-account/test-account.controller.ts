import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { TestAccountService } from './test-account.service';
import { TestAccount } from '../../models/TestAccount';
import { TestAccountDto } from './dto/test-account.dto';

@Controller('api/admin/test-accounts')
export class TestAccountController {
  constructor(private readonly testAccountService: TestAccountService) {}

  /**
   * Create a new test account or update an existing one
   */
  @Post()
  async createOrUpdateTestAccount(@Body() dto: TestAccountDto): Promise<TestAccount> {
    return this.testAccountService.createOrUpdateTestAccount(
      dto.phoneNumber,
      dto.otp,
      dto.description || 'Test account',
    );
  }

  /**
   * Get a test account by phone number
   */
  @Get(':phoneNumber')
  async getTestAccount(@Param('phoneNumber') phoneNumber: string): Promise<TestAccount | null> {
    return this.testAccountService.getTestAccountByPhone(phoneNumber);
  }

  /**
   * Delete a test account
   */
  @Delete(':phoneNumber')
  async deleteTestAccount(@Param('phoneNumber') phoneNumber: string): Promise<{ success: boolean }> {
    const success = await this.testAccountService.deleteTestAccount(phoneNumber);
    return { success };
  }

  /**
   * Check if a phone number belongs to a test account
   */
  @Get('check/:phoneNumber')
  async isTestAccount(@Param('phoneNumber') phoneNumber: string): Promise<{ isTestAccount: boolean }> {
    const isTestAccount = await this.testAccountService.isTestAccount(phoneNumber);
    return { isTestAccount };
  }
} 