import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../../models/User';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';

/**
 * Service for managing user operations
 */
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  /**
   * Updates user status based on id, email, or phone
   * If email or phone is provided, sets status to false (inactive)
   * If id is provided, uses the status from request body
   */
  async updateUserStatus(updateUserStatusDto: UpdateUserStatusDto): Promise<{ message: string; affectedRows?: number }> {
    const { id, email, phone, status } = updateUserStatusDto;
    if (!id && !email && !phone) {
      throw new BadRequestException('id, email, or phone is required');
    }
    if (id) {
      const user = await this.userModel.findByPk(id);
      if (!user) {
        throw new NotFoundException('User id not found');
      }
      if (typeof status !== 'boolean') {
        throw new BadRequestException('status is required when id is provided');
      }
      await this.userModel.update(
        { status },
        { where: { id } },
      );
      return { message: 'Status updated successfully' };
    }
    if (email) {
      const normalizedEmail = email.toLowerCase();
      const user = await this.userModel.findOne({
        where: { email: normalizedEmail },
      });
      if (!user) {
        throw new NotFoundException('User with this email not found');
      }
      const [affectedRows] = await this.userModel.update(
        { status: false },
        { where: { email: normalizedEmail } },
      );
      return {
        message: 'User status updated to inactive successfully',
        affectedRows,
      };
    }
    if (phone) {
      const phoneNumber = String(phone);
      const user = await this.userModel.findOne({
        where: { phone: phoneNumber },
      });
      if (!user) {
        throw new NotFoundException('User with this phone number not found');
      }
      const [affectedRows] = await this.userModel.update(
        { status: false },
        { where: { phone: phoneNumber } },
      );
      return {
        message: 'User status updated to inactive successfully',
        affectedRows,
      };
    }
  }
}

