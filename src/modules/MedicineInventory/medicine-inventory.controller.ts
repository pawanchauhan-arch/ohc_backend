import {
  Controller,
  Get,
  Query,
  Put,
  Patch,
  Param,
  Body,
  Post,
  ParseIntPipe,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MedicineInvetoryService } from './medicine-inventory.service';
import { Delete } from '@nestjs/common';
import { JwtAdminGuardB2C } from '../auth/guards/jwt-b2c-auth.guard';
import { Request } from 'express';
import { GlobalHelper } from 'src/helper/global.helper';
@UseGuards(JwtAdminGuardB2C)
@Controller('api/medicine-inventory')
export class MedicineInvetoryController {
  constructor(private readonly service: MedicineInvetoryService) {}

  // ---------------- ITEM TYPES ----------------
  @Get()
  async getAllM(@Req() req: Request, @Query() query: any) {
    return this.service.getAllMedicineItems(req['user'], query);
  }

  @Get('types')
  getAllTypes(@Query('activeOnly') activeOnly?: string) {
    return this.service.findAllType(activeOnly === 'true');
  }

  @Post('types')
  createType(@Req() req: Request, @Body() body: any) {
    return this.service.createType(req['user'], body);
  }

  @Put('types/:id')
  updateType(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateType(id, body);
  }

  @Patch('types/:id/active')
  activateType(@Param('id', ParseIntPipe) id: number) {
    return this.service.setActiveType(id, true);
  }

  @Patch('types/:id/inactive')
  inactivateType(@Param('id', ParseIntPipe) id: number) {
    return this.service.setActiveType(id, false);
  }

  // ---------------- ITEM DETAILS ----------------

  @Get('items')
  getAllItems(
    @Req() req: Request,
    @Query('itemtypeid') itemtypeid: number,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.service.findByItemType(
      req['user'],
      Number(itemtypeid),
      activeOnly === 'true',
    );
  }

  @Post('items')
  createItem(@Req() req: Request, @Body() body: any) {
    return this.service.createItemDetail(req['user'], body);
  }

  @Put('items/:id')
  updateItem(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateItemDetail(id, body);
  }

  @Patch('items/:id/active')
  activateItem(@Param('id', ParseIntPipe) id: number) {
    return this.service.setActiveItemDetail(id, true);
  }

  @Patch('items/:id/inactive')
  inactivateItem(@Param('id', ParseIntPipe) id: number) {
    return this.service.setActiveItemDetail(id, false);
  }

  // ---------------- STOCK DETAILS ----------------

  @Post('stock')
  addStockDetails(@Req() req: Request, @Body() body: any) {
    return this.service.addStockDetails(req['user'], body);
  }

  @Get('stock/view')
  async viewStockBills(@Req() req: Request, @Query() query: any) {
    return this.service.viewStockBills(req['user'], query);
  }
  @Put('stock/:id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updateStockDetails(id, body);
  }
  @Get('stock/view/expiry')
  async viewExpireStock(@Req() req: Request, @Query() query: any) {
    return this.service.getExpiryItems(req['user'], query);
  }
  @Get('stock/view/sales')
  async viewSalesItems(@Req() req: Request, @Query() query: any) {
    return this.service.viewSaleMedicineStockBills(req['user'], query);
  }
  @Get('stock/view/sales/patient-name')
  async getPatientNameFromBillHeader(@Req() req: Request, @Query() query: any) {
    return this.service.getPatientNameFromBillHeader(req['user'], query);
  }
  // @Delete('stock/:id')
  // async deleteStock(@Param('id', ParseIntPipe) id: number) {
  //   return this.service.deleteStockDetails(id);
  // }
  @Delete('stock/:id')
async deleteStock(
  @Req() req: Request,
  @Param('id', ParseIntPipe) id: number,
) {
  const result = await this.service.deleteStockDetails(id);

  const userV = req['user'];

  await GlobalHelper.createUserLogs({
    user_id: userV.id,
    action_type: 'delete_medicine_stock',
    action_description: `Deleted Medicine Stock ID: ${id}`,
    user_ip: req.ip,
    action_time: new Date(),
  });

  return result;
}
  @Post('bill')
  async lastBill(@Req() req: Request, @Body() body: any) {
    return this.service.addPhramaBilling(req['user'], body);
  }
  @Get('bill/:id')
  async getBill(@Req() req: Request,@Param('id', ParseIntPipe) id: number) {
    return this.service.getPharmaBillById(req['user'],id);
  }
  @Put('bill/:id')
  async updateBill(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updatePharmaBilling(id, body);
  }
  @Get('stock/view/low-stock')
  async getLowStock(@Req() req: Request) {
    return this.service.getLowStockItems(req['user']);
  }
   @Post('camp/bill')
  async lastcampBill(@Req() req: Request, @Body() body: any) {
    return this.service.addPhramacampBilling(req['user'], body);
  }
  @Get('camp/bill/:id')
  async getcampBill(@Req() req: Request,@Param('id', ParseIntPipe) id: number) {
    return this.service.getPharmacampBillById(req['user'],id);
  }
  @Put('camp/bill/:id')
  async updatecampBill(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.service.updatePharmacampBilling(id, body);
  }
   @Get('stock/camp/view/sales')
  async viewSalescampItems(@Req() req: Request, @Query() query: any) {
    return this.service.viewSaleMedicineStockcampBills(req['user'], query);
  }
  @Get('stock/view/sales/camp/patient-name')
  async getPatientNameFromcampBillHeader(@Req() req: Request, @Query() query: any) {
    return this.service.getPatientNameFromcampBillHeader(req['user'], query);
  }
//   @Patch('bill/:id/delete')
// async softDeleteBill(
//   @Param('id', ParseIntPipe) id: number,
// ) {
//   return this.service.softDeleteBill(id);
// }
@Patch('bill/:id/delete')
async softDeleteBill(
  @Req() req: Request,
  @Param('id', ParseIntPipe) id: number,
) {
  const result = await this.service.softDeleteBill(id);

  const userV = req['user'];

  await GlobalHelper.createUserLogs({
    user_id: userV.id,
    action_type: 'delete_pharma_bill',
    action_description: `Deleted Pharma Bill ID: ${id}`,
    user_ip: req.ip,
    action_time: new Date(),
  });

  return result;
}
@Get('added-by')
async getaddedBy(@Req() req: Request) {
  return await this.service.getaddedBy(req['user']);
}
//  @Patch('camp/bill/:id/delete')
// async softDeletecampBill(
//   @Param('id', ParseIntPipe) id: number,
// ) {
//   return this.service.softDeletecampBill(id);
// }.
@Patch('camp/bill/:id/delete')
async softDeletecampBill(
  @Req() req: Request,
  @Param('id', ParseIntPipe) id: number,
) {
  const result = await this.service.softDeletecampBill(id);

  const userV = req['user'];

  await GlobalHelper.createUserLogs({
    user_id: userV.id,
    action_type: 'delete_camp_pharma_bill',
    action_description: `Deleted Camp Pharma Bill ID: ${id}`,
    user_ip: req.ip,
    action_time: new Date(),
  });

  return result;
}
@Get('camp/added-by')
async getcampaddedBy(@Req() req: Request) {
  return await this.service.getcampaddedBy(req['user']);
}
@Get('stock/view/all-sales')
async viewAllSales(
  @Req() req: Request,
  @Query() query: any,
) {
  return this.service.viewAllSalesBills(
    req['user'],
    query,
  );
}
@Get('sales/added-by')
async getSalesAddedBy(
  @Req() req: Request,
) {
  return await this.service.getSalesAddedBy(
    req['user'],
  );
}
}