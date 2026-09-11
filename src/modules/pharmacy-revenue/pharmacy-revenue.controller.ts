import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
  Res
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { PharmacyRevenueService } from './pharmacy-revenue.service';
import { GlobalHelper } from 'src/helper/global.helper';

@UseGuards(JwtAdminGuardB2C)
@Controller('api/pharmacy-revenue')
export class PharmacyRevenueController {
  constructor(
    private readonly pharmacyRevenueService: PharmacyRevenueService,
  ) {}

  @Post()
  async create(
    @Req() req: Request,
    @Body() body: any,
  ) {
    return this.pharmacyRevenueService.create(
      req['user'],
      body,
    );
  }
   @Get('export')
exportRevenue(
  @Req() req,
  @Query() query,
  @Res() res,
) {
  return this.pharmacyRevenueService.exportRevenue(
    req.user,
    query,
    res,
  );
}

  @Get('view')
  async view(
    @Req() req: Request,
    @Query() query: any,
  ) {
    return this.pharmacyRevenueService.view(
      req['user'],
      query,
    );
  }

  @Get(':id')
  async getById(
    @Req() req: Request,
    @Param('id') id: number,
  ) {
    return this.pharmacyRevenueService.getById(
      req['user'],
      Number(id),
    );
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() body: any,
  ) {
    return this.pharmacyRevenueService.update(
      Number(id),
      body,
    );
  }

  @Delete(':id')
  async delete(
    @Req() req: Request,
    @Param('id') id: number,
  ) {
    const result =
      await this.pharmacyRevenueService.delete(
        Number(id),
      );

    const userV = req['user'];

    await GlobalHelper.createUserLogs({
      user_id: userV.id,
      action_type: 'delete_pharmacy_revenue',
      action_description: `Deleted Revenue ID: ${id}`,
      user_ip: req.ip,
      action_time: new Date(),
    });

    return result;
  }
 
}