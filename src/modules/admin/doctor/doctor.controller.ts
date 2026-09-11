import { Controller, Post, Req, Res, UseGuards,UseInterceptors } from '@nestjs/common';
import { Request, Response } from 'express';
import { DoctorService } from './doctor.service';
import { JwtAdminGuard } from '../../auth/guards/jwt-auth.guard';
import { AdminContextInterceptor } from 'src/common/interceptors/admin-context.interceptor';

@UseInterceptors(AdminContextInterceptor)
@Controller('api/v1/admin')
@UseGuards(JwtAdminGuard)
export class DoctorController {
  constructor(private readonly doctorService: DoctorService) {}

  @Post('create/doctor')
  async createDoctor(@Req() req: Request, @Res() res: Response) {
    return this.doctorService.createDoctor(req, res);
  }

  @Post('view/doctor')
  async viewDoctor(@Req() req: Request, @Res() res: Response) {
    return this.doctorService.viewDoctor(req, res);
  }

  @Post('doctor/detail')
  async detailDoctor(@Req() req: Request, @Res() res: Response) {
    return this.doctorService.detailDoctor(req, res);
  }

  @Post('doctor/update')
  async updateDoctor(@Req() req: Request, @Res() res: Response) {
    return this.doctorService.updateDoctor(req, res);
  }

  @Post('update/doctor/status')
  async updateDoctorStatus(@Req() req: Request, @Res() res: Response) {
    return this.doctorService.updateDoctorStatus(req, res);
  }
}

