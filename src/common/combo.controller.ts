// import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
// import { ComboService } from './combo.service';
// import { JwtAdminGuardB2C } from 'src/modules/auth/guards/jwt-b2c-auth.guard';
// @UseGuards(JwtAdminGuardB2C)
// @Controller('api/combo')
// export class ComboController {
//   constructor(private readonly comboService: ComboService) {}

//   @Get(':type')
//   async getCombo(@Param('type') type: string, @Req() req: any) {
//     switch (type) {
//       case 'doctor':
//         return this.comboService.getDoctors(req.user);
//       case 'department':
//         return this.comboService.getDepartments();
//       case 'paymode':
//         return this.comboService.getPayModes();
//       case 'collectedBy':
//         return this.comboService.getCollectedBy();
//       case 'diseases-byname':
//         return this.comboService.getAllDiseases();
//       case 'mediciene-supplier':
//         return this.comboService.getAllMedicineSuppliers();
//       case 'medicine-type':
//         return this.comboService.getAllMedicineType();
//       case 'hsn-code':
//         return this.comboService.getAllHSNCode();
//       case 'users':
//         return this.comboService.getAllUser();
//       case 'center-combo':
//         return this.comboService.getCenterCombo();
//       case 'b2c-users':
//         return this.comboService.getB2CAllUser();
//         case 'b2c-relationship':
//         return this.comboService.getB2CAllRelation();
//         case 'b2c-occupation':
//         return this.comboService.getB2CAllOccupation();
//       default:
//         return [];
//     }
//   }
// }

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { ComboService } from './combo.service';
import { JwtAdminGuardB2C } from 'src/modules/auth/guards/jwt-b2c-auth.guard';

@Controller('api/combo')
export class ComboController {
  constructor(private readonly comboService: ComboService) {}

  @Get('doctor')
  @UseGuards(JwtAdminGuardB2C)
  async getDoctors(@Req() req: any) {
    return this.comboService.getDoctors(req.user);
  }
  @Get('nursing')
  @UseGuards(JwtAdminGuardB2C)
  async getB2CNursing(@Req() req: any) {
    return this.comboService.getB2CNursing(req.user);
  }
  @Get('lab')
  @UseGuards(JwtAdminGuardB2C)
  async getLab(@Req() req: any) {
    return this.comboService.getLab(req.user);
  }
  @Get('radiology')
  @UseGuards(JwtAdminGuardB2C)
  async getRadiology(@Req() req: any) {
    return this.comboService.getRadiology(req.user);
  }

  @Get(':type')
  async getCombo(@Param('type') type: string) {
    switch (type) {
      case 'department':
        return this.comboService.getDepartments();
      case 'paymode':
        return this.comboService.getPayModes();
      case 'collectedBy':
        return this.comboService.getCollectedBy();
      case 'diseases-byname':
        return this.comboService.getAllDiseases();
      case 'mediciene-supplier':
        return this.comboService.getAllMedicineSuppliers();
      case 'medicine-type':
        return this.comboService.getAllMedicineType();
      case 'hsn-code':
        return this.comboService.getAllHSNCode();
      case 'users':
        return this.comboService.getAllUser();
      case 'center-combo':
        return this.comboService.getCenterCombo();
      case 'b2c-users':
        return this.comboService.getB2CAllUser();
      case 'b2c-relationship':
        return this.comboService.getB2CAllRelation();
      case 'b2c-occupation':
        return this.comboService.getB2CAllOccupation();
      default:
        return [];
    }
  }
}
