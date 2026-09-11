import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    BadRequestException,
    InternalServerErrorException,
    Res,
    Req,
    UseGuards
} from '@nestjs/common';
import { CampOpdBillingService } from './campopd.service';
import { Response,Request } from 'express';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { GlobalHelper } from 'src/helper/global.helper';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/camp-opd-billing')
export class CampOpdController {
    constructor(private readonly opdBillingService: CampOpdBillingService) { }

    @Post()
    async createBill( @Req() req: Request,@Body() body: any) {
        try {
            return await this.opdBillingService.createBill(req['user'], body);
        } catch (error: any) {
            throw new InternalServerErrorException(error.message);
        }
    }
    @Get('camp/collected-by')
async getCollectedcampBy(@Req() req: Request) {
  return await this.opdBillingService.getCollectedcampBy(req['user']);
}

    @Get()
    async getAllBills(@Req() req: Request,@Query() query: any) {
        return await this.opdBillingService.getAllBills(req['user'], query);
    }
    @Get('view')
    async viewOpdBills(@Req() req: Request, @Query() query: any) {
        return this.opdBillingService.viewOpdBillingcamp(req['user'], query);
    }
    @Get('opd-billing-export')
    async exportOpdBills(@Req() req: Request, @Query() query: any, @Res() res: Response) {
        try {
            return await this.opdBillingService.exportOpdBilling(req['user'], query, res);
        } catch (error: any) {
            throw new InternalServerErrorException(error.message);
        }
    }


    @Get(':id')
    async getBillById(@Req() req: Request, @Param('id') id: number) {
        return await this.opdBillingService.getBillById(req['user'],id);
    }

    @Put(':id')
    async updateBill(@Param('id') id: number, @Body() body: any) {
        return await this.opdBillingService.updateBill(id, body);
    }

    // @Delete(':id')
    // async deleteBill(@Param('id') id: number) {
    //     return await this.opdBillingService.deleteBill(id);
    // }
    @Delete(':id')
async deleteBill(
  @Req() req: Request,
  @Param('id') id: number,
) {
  const result =
    await this.opdBillingService.deleteBill(id);

  const userV = req['user'];

  await GlobalHelper.createUserLogs({
    user_id: userV.id,
    action_type: 'delete_camp_opd_bill',
    action_description: `Deleted Camp OPD Bill ID: ${id}`,
    user_ip: req.ip,
    action_time: new Date(),
  });

  return result;
}

    @Put('billing-detail/:id')
    async updateBillDetail(@Param('id') id: number, @Body() body: any) {
        return this.opdBillingService.updateBillDetail(id, body);
    }

    // @Delete('billing-detail/:id')
    // async deleteBillDetail(@Param('id') id: number) {
    //     return this.opdBillingService.deleteBillDetail(id);
    // }
    @Delete('billing-detail/:id')
async deleteBillDetail(
  @Req() req: Request,
  @Param('id') id: number,
) {
  const result =
    await this.opdBillingService.deleteBillDetail(id);

  const userV = req['user'];

  await GlobalHelper.createUserLogs({
    user_id: userV.id,
    action_type: 'delete_camp_opd_bill_detail',
    action_description: `Deleted Camp OPD Bill Detail ID: ${id}`,
    user_ip: req.ip,
    action_time: new Date(),
  });

  return result;
}

}