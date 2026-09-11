import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { TestAccount } from 'src/models/TestAccount';
import { sendSuccess, sendError } from 'src/utils/response.util';
@Injectable()
export class TestAccountService {
  async createOrUpdateTestAccount(req: Request, res: Response) {
    try {
      if (!req.body?.email) {
        return sendError(res, 400, 'Email is required');
      }

      if (!req.body?.password) {
        return sendError(res, 400, 'Password is required');
      }

      const testAccount = await this.createOrUpdateTestAccountByEmail(
        req.body.email,
        req.body.password,
        req.body.description ||
          'Test account for email/password authentication',
      );

      return sendSuccess(
        res,
        200,
        testAccount,
        'Test account created/updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async getTestAccount(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return sendError(res, 400, 'Email parameter is required');
      }

      const testAccount = await this.getTestAccountByEmail(email);

      if (!testAccount) {
        return sendError(res, 404, 'Test account not found');
      }

      return sendSuccess(
        res,
        200,
        testAccount,
        'Test account retrieved successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  async deleteTestAccount(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return sendError(res, 400, 'Email parameter is required');
      }

      const success = await this.deleteTestAccountByEmail(email);

      if (!success) {
        return sendError(res, 404, 'Test account not found');
      }

      return sendSuccess(
        res,
        200,
        { success: true },
        'Test account deleted successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  /**
   * Check if email is a test account
   */
  async isTestAccount(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return sendError(res, 400, 'Email parameter is required');
      }

      const isTestAccount = await this.isTestAccountByEmail(email);

      return sendSuccess(
        res,
        200,
        { isTestAccount },
        'Check completed successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  /**
   * Get all test accounts
   */
  async getAllTestAccounts(req: Request, res: Response) {
    try {
      const testAccounts = await this.getAllTestAccountsInternal();

      return sendSuccess(
        res,
        200,
        testAccounts,
        'Test accounts retrieved successfully',
      );
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }

  /* ------------------------------------------------------------------
   * INTERNAL / REUSABLE METHODS (callable from other modules)
   * ------------------------------------------------------------------ */

  async isTestAccountByEmail(email: any): Promise<boolean> {
    try {
      const testAccount = await TestAccount.findOne({
        where: { email, isTestAccount: true },
      });
      return !!testAccount;
    } catch (error) {
      throw error;
    }
  }

  async getTestAccountByEmail(email: any) {
    try {
      return await TestAccount.findOne({
        where: { email, isTestAccount: true },
      });
    } catch (error) {
      throw error;
    }
  }

  async verifyTestAccountPassword(
    email: string,
    password: string,
  ): Promise<boolean> {
    try {
      const testAccount = await TestAccount.findOne({
        where: { email, isTestAccount: true },
      });

      if (!testAccount) return false;
      return testAccount.password === password;
    } catch (error) {
      throw error;
    }
  }

  async createOrUpdateTestAccountByEmail(
    email: string,
    password: string,
    description?: string,
  ) {
    try {
      const [testAccount, created] = await TestAccount.findOrCreate({
        where: { email },
        defaults: {
          email,
          password,
          isTestAccount: true,
          description:
            description || 'Test account for email/password authentication',
        },
      });

      if (!created) {
        testAccount.password = password;
        testAccount.isTestAccount = true;
        testAccount.description = description || testAccount.description;
        await testAccount.save();
      }

      return testAccount;
    } catch (error) {
      throw error;
    }
  }

  async deleteTestAccountByEmail(email: any): Promise<boolean> {
    try {
      const deleted = await TestAccount.destroy({
        where: { email },
      });
      return deleted > 0;
    } catch (error) {
      throw error;
    }
  }

  async getAllTestAccountsInternal() {
    try {
      return await TestAccount.findAll({
        where: { isTestAccount: true },
        order: [['createdAt', 'DESC']],
      });
    } catch (error) {
      throw error;
    }
  }
}
