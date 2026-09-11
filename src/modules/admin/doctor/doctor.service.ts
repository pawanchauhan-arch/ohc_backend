import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../../../utils/response.util';
import { User } from '../../../models/User';
import { Doctor } from '../../../models/Doctor';

@Injectable()
export class DoctorService {
  async createDoctor(req: Request, res: Response) {
    const {
      registration_number,
      qualification,
      signature,
      username,
      contact_number,
    } = req.body;

    try {
      const userData = {
        username,
        phone: contact_number,
        status: true,
        role_id: 4,
        isAdmin: false,
      };

      const insert = await User.create(userData);

      const external_id = `DR00${insert.id}`;

      const data = {
        registration_number,
        contact_number,
        user_id: insert.id,
        qualification,
        signature,
        file_name: null,
        external_id,
      };

      const doctor = await Doctor.create(data);

      return sendSuccess(res, 201, doctor, 'Create Doctor successfully');
    } catch (error) {
      return sendError(res, 500, 'Invalid input');
    }
  }

  async viewDoctor(req: Request, res: Response) {
    try {
      const doctors = await Doctor.findAll({
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'status', 'phone'],
            where: {
              tenant_id: null,
            },
          },
        ],
        order: [['id', 'DESC']],
      });

      return sendSuccess(res, 200, doctors, 'Success');
    } catch (error) {
      return sendError(res, 500, 'Internal error');
    }
  }

  async detailDoctor(req: Request, res: Response) {
    const { id } = req.body;

    if (!id) {
      return sendError(res, 400, 'id required');
    }

    try {
      const doctor = await Doctor.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'status', 'phone'],
            where: {
              tenant_id: null,
            },
          },
        ],
      });

      return sendSuccess(res, 201, doctor, 'Success');
    } catch (error) {
      return sendError(res, 500, 'Internal error');
    }
  }

  async updateDoctor(req: Request, res: Response) {
    const {
      id,
      username,
      contact_number,
      registration_number,
      qualification,
      signature,
    } = req.body;

    if (!id) {
      return sendError(res, 400, 'Doctor ID required');
    }

    try {
      const doctor = await Doctor.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'phone'],
          },
        ],
      });

      if (!doctor) {
        return sendError(res, 404, 'Doctor not found');
      }

      await User.update(
        { username, phone: contact_number },
        { where: { id: doctor.user.id } },
      );

      await Doctor.update(
        {
          registration_number,
          qualification,
          signature,
          file_name: null,
          contact_number,
        },
        { where: { id } },
      );

      const updatedDoctor = await Doctor.findByPk(id, {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'phone'],
          },
        ],
      });

      return sendSuccess(
        res,
        200,
        updatedDoctor,
        'Doctor updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal error');
    }
  }

  async updateDoctorStatus(req: Request, res: Response) {
    const { id, status } = req.body;

    if (!id) {
      return sendError(res, 400, 'Doctor ID required');
    }

    try {
      const doctor = await Doctor.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['id', 'username', 'phone'],
          },
        ],
      });

      if (!doctor) {
        return sendError(res, 404, 'Doctor not found');
      }

      await User.update({ status }, { where: { id: doctor.user.id } });

      return sendSuccess(
        res,
        200,
        status,
        'Doctor status updated successfully',
      );
    } catch (error) {
      return sendError(res, 500, 'Internal error');
    }
  }
}
