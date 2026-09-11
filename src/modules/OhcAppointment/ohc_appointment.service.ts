import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OHCAppointment } from '../../models/OhcAppointment.model';

@Injectable()
export class OhcAppointmentService {
  constructor(
    @InjectModel(OHCAppointment)
    private readonly appointmentModel: typeof OHCAppointment,
  ) { }


  async create(data: Partial<OHCAppointment>) {
    try {
      if (!data.appointment_datetime) {
        throw new BadRequestException("Appointment datetime required");
      }

      const now = new Date();
      const appointmentTime = new Date(data.appointment_datetime);
      if (appointmentTime < now) {
        throw new BadRequestException("Cannot book appointment in past");
      }
      const checkIn = data.check_in_time ? new Date(data.check_in_time) : null;
      const checkOut = data.check_out_time ? new Date(data.check_out_time) : null;

      if (checkIn && checkOut && checkOut < checkIn) {
        throw new BadRequestException("Check-out time cannot be before check-in time");
      }
      const existing = await this.appointmentModel.findOne({
        where: {
          doctor_id: data.doctor_id,
          appointment_datetime: data.appointment_datetime,
        },
      });

      if (existing) {
        throw new BadRequestException("Doctor already has appointment at this time");
      }

      return await this.appointmentModel.create(data as any);

    } catch (error:any) {
      throw new InternalServerErrorException(error.message);
    }
  }


  async findAll() {
    return await this.appointmentModel.findAll({
      order: [['id', 'DESC']],
    });
  }


  async findOne(id: number) {
    const data = await this.appointmentModel.findByPk(id);
    if (!data) throw new NotFoundException('Appointment not found');
    return data;
  }


  async update(id: number, data: Partial<OHCAppointment>) {
    try {
      const record = await this.appointmentModel.findByPk(id);
      if (!record) {
        throw new NotFoundException('Appointment not found');
      }


      if (!data.appointment_datetime) {
        throw new BadRequestException("Appointment datetime required");
      }

      const now = new Date();
      const appointmentTime = new Date(data.appointment_datetime);

      if (appointmentTime < now) {
        throw new BadRequestException("Cannot book appointment in past");
      }


      const existing = await this.appointmentModel.findOne({
        where: {
          doctor_id: data.doctor_id,
          appointment_datetime: data.appointment_datetime,
        },
      });

      if (existing && existing.id !== id) {
        throw new BadRequestException(
          "Doctor already has appointment at this time"
        );
      }


      const checkIn = data.check_in_time
        ? new Date(data.check_in_time)
        : null;

      const checkOut = data.check_out_time
        ? new Date(data.check_out_time)
        : null;

      if (checkIn && checkOut && checkOut < checkIn) {
        throw new BadRequestException(
          "Check-out time cannot be before check-in time"
        );
      }


      await record.update(data);

      return {
        message: 'Updated successfully',
        data: record,
      };

    } catch (error:any) {

      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        error.message || 'Something went wrong while updating appointment'
      );
    }
  }


  async delete(id: number) {
    const deleted = await this.appointmentModel.destroy({
      where: { id },
    });

    if (!deleted) throw new NotFoundException('Appointment not found');

    return { message: 'Deleted successfully' };
  }
}