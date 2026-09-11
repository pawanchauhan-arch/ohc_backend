import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { CetManagementService } from './cet-management.service';
import { JwtAdminGuardCenter } from '../../auth/guards/jwtCenter-auth.guard';
import { sendSuccess, sendError } from '../../../utils/response.util';

@UseGuards(JwtAdminGuardCenter)
@Controller('api/v1/center')
export class CetListController {
  constructor(private readonly cetManagementService: CetManagementService) {}

  @Get('view/CET')
  async listCETs(@Req() req: any, @Res() res: any) {
    try {
      const list = await this.cetManagementService.listAllCETs();
      return sendSuccess(res, 200, list, 'CET List Fetch Successful');
    } catch (error) {
      console.error('listCETs error:', error);
      return sendError(res, 500, 'internal server error');
    }
  }
}
