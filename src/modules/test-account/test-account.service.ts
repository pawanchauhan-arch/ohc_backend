import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { TestAccount } from '../../models/TestAccount';

@Injectable()
export class TestAccountService {
  constructor(
    @InjectModel(TestAccount)
    private testAccountModel: typeof TestAccount,
  ) {}

  /**
   * Check if a phone number belongs to a test account
   * @param phoneNumber The phone number to check
   * @returns True if the phone number belongs to a test account, false otherwise
   */
  async isTestAccount(phoneNumber: string): Promise<boolean> {
    const testAccount = await this.testAccountModel.findOne({
      where: { phone: phoneNumber, isTestAccount: true },
    });
    return !!testAccount;
  }

  /**
   * Get a test account by phone number
   * @param phoneNumber The phone number to search for
   * @returns The test account if found, null otherwise
   */
  async getTestAccountByPhone(phoneNumber: string): Promise<TestAccount | null> {
    return this.testAccountModel.findOne({
      where: { phone: phoneNumber, isTestAccount: true },
    });
  }

  /**
   * Create a new test account or update an existing one
   * @param phoneNumber The phone number for the test account
   * @param otp The OTP for the test account
   * @param description A description of the test account purpose
   * @returns The created or updated test account
   */
  async createOrUpdateTestAccount(
    phoneNumber: string,
    otp: string,
    description: string,
  ): Promise<TestAccount> {
    const [testAccount, created] = await this.testAccountModel.findOrCreate({
      where: { phone: phoneNumber },
      defaults: {
        phone: phoneNumber,
        otp,
        isTestAccount: true,
        description,
      },
    });

    if (!created) {
      // Update the existing test account
      testAccount.otp = otp;
      testAccount.isTestAccount = true;
      testAccount.description = description;
      await testAccount.save();
    }

    return testAccount;
  }

  /**
   * Delete a test account
   * @param phoneNumber The phone number of the test account to delete
   * @returns True if successful, false otherwise
   */
  async deleteTestAccount(phoneNumber: string): Promise<boolean> {
    const deleted = await this.testAccountModel.destroy({
      where: { phone: phoneNumber },
    });
    return deleted > 0;
  }

  /**
   * Verify if the provided OTP matches the test account OTP
   * @param phoneNumber The phone number
   * @param otp The OTP to verify
   * @returns True if the OTP matches, false otherwise
   */
  async verifyTestAccountOtp(phoneNumber: string, otp: string): Promise<boolean> {
    const testAccount = await this.testAccountModel.findOne({
      where: { phone: phoneNumber, isTestAccount: true },
    });

    return testAccount?.otp === otp;
  }
} 