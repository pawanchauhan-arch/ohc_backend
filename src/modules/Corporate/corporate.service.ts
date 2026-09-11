import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Corporate } from '../../models/corporate';
import { CorporateUser } from '../../models/corporate-user';
import { User } from '../../models/User'; 
import { Center } from '../../models/Center'; 
import { CreateCorporateDto } from './dto/create-corporate.dto';
import { CreateAndAssignUserDto } from './dto/assign-corporate-user.dto';
import { Sequelize } from 'sequelize-typescript'; // Import Sequelize for transactions
import * as bcrypt from 'bcrypt'; // Import bcrypt


@Injectable()
export class CorporateService {
  constructor(
    @InjectModel(Corporate) private corporateModel: typeof Corporate,
    @InjectModel(CorporateUser) private corporateUserModel: typeof CorporateUser,
    @InjectModel(User) private userModel: typeof User,
    @InjectModel(Center) private centerModel: typeof Center, // Inject Center
    private sequelize: Sequelize // Inject Sequelize
  ) {}

  // --- Create Corporate ---
  async create(createCorporateDto: CreateCorporateDto): Promise<Corporate> {
    
    // 1. Validate that all center_ids exist
    const count = await this.centerModel.count({
      where: {
        id: createCorporateDto.center_ids
      }
    });

    if (count !== createCorporateDto.center_ids.length) {
      throw new BadRequestException('One or more Center IDs provided do not exist');
    }

    const uniqueId = `CORP-${Date.now()}`;
    return this.corporateModel.create({ ...createCorporateDto, uniqueId, status: createCorporateDto.status || 'Active' });
  }

async createAndAssignUser(dto: CreateAndAssignUserDto) {
    // 1. Fetch Corporate
    const corporate = await this.corporateModel.findByPk(dto.corporate_id);
    if (!corporate) throw new NotFoundException('Corporate not found');

    // 2. Resolve center_id: use provided value or first center from corporate (DB requires NOT NULL)
    const centerIds = (corporate.center_ids as number[]) || [];
    let centerId: number;
    if (dto.center_id != null) {
      if (!centerIds.includes(dto.center_id)) {
        throw new BadRequestException(`Center ID ${dto.center_id} is not associated with this Corporate`);
      }
      centerId = dto.center_id;
    } else {
      if (centerIds.length === 0) {
        throw new BadRequestException('Corporate has no centers; provide center_id or add centers to the corporate');
      }
      centerId = centerIds[0];
    }

    // 3. Start a Database Transaction
    const transaction = await this.sequelize.transaction();

    try {
      // --- Step A: Prepare User Data ---
      const hashedPassword = await bcrypt.hash(dto.password, 10);

      // Check if username/email already exists to prevent unique constraint errors inside transaction
      const existingUser = await this.userModel.findOne({
        where: { email: dto.email },
        transaction
      });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // --- Step B: Create the User ---
      const newUser = await this.userModel.create({
        username: dto.username,
        name: dto.name,
        role_id: dto.role_id || 8,
        permission_id: dto.permission_id || null,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        isAdmin: false,
        status: true,
        external_id: dto.external_id || `EXT-${Date.now()}`,
      }, { transaction });

      // --- Step C: Create the Corporate Association (center_id required by DB) ---
      const corporateUser = await this.corporateUserModel.create({
        corporate_id: dto.corporate_id,
        user_id: newUser.id,
        center_id: centerId,
        isActive: true
      }, { transaction });

      // 4. Commit Transaction
      await transaction.commit();

      // Return combined result (exclude password)
      const { password, ...userResult } = newUser.get({ plain: true });
      return {
        user: userResult,
        association: corporateUser
      };

    } catch (error) {
      // 5. Rollback on Error
      await transaction.rollback();
      
      // Re-throw appropriate exceptions
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error(error);
      return error;
    }
  }


  async removeUserFromCorporate(corporateId: number, userId: number): Promise<void> {
    const mapping = await this.corporateUserModel.findOne({
        where: { corporate_id: corporateId, user_id: userId }
    });
    
    if (!mapping) throw new NotFoundException('Mapping not found');
    await mapping.destroy();
  }

  /**
   * Corporate user active/inactive toggle.
   * Requirement:
   * - Disable/enable is controlled by Users.status
   * - If corporate.status is InActive, do not allow enabling the user.
   */
  async updateCorporateUserLoginStatus(payload: { corporateId: number; userId: number; status: boolean }) {
    const { corporateId, userId, status } = payload;

    if (!corporateId) throw new BadRequestException('corporateId required');
    if (!userId) throw new BadRequestException('userId required');
    if (typeof status !== 'boolean') throw new BadRequestException('status must be boolean');

    const corporate = await this.corporateModel.findByPk(corporateId);
    if (!corporate) throw new NotFoundException('Corporate not found');

    if (String(corporate.status) === 'InActive' && status === true) {
      throw new BadRequestException('Corporate is inactive; users cannot be activated');
    }

    const mapping = await this.corporateUserModel.findOne({
      where: { corporate_id: corporateId, user_id: userId },
    });
    if (!mapping) throw new NotFoundException('Mapping not found');

    await this.userModel.update({ status }, { where: { id: userId } });
    return { status: true, message: 'Corporate user status updated successfully', data: { userId, status } };
  }

  async findOne(id: number): Promise<Corporate> {
    const corporate = await this.corporateModel.findByPk(id, {
      include: [
        { 
          model: CorporateUser, 
          include: ['user', 'center'] // Load detailed info
        }
      ],
    });
    if (!corporate) {
      throw new NotFoundException(`Corporate with ID ${id} not found`);
    }
    return corporate;
  }

  async update(id: number, updateData: Partial<CreateCorporateDto>): Promise<Corporate> {
    const normalizedStatus =
      updateData?.status != null
        ? String(updateData.status)
        : null;

    if (normalizedStatus && normalizedStatus !== 'Active' && normalizedStatus !== 'InActive') {
      throw new BadRequestException('Invalid status. Use Active or InActive');
    }

    const transaction = await this.sequelize.transaction();
    try {
      const corporate = await this.corporateModel.findByPk(id, { transaction });
      if (!corporate) throw new NotFoundException(`Corporate with ID ${id} not found`);
      const updated = await corporate.update(updateData, { transaction });

      // Requirement: If corporate becomes InActive, force all mapped users to inactive (Users.status=false).
      if (normalizedStatus === 'InActive') {
        const mappings = await this.corporateUserModel.findAll({
          where: { corporate_id: id },
          attributes: ['user_id'],
          transaction,
        });
        const userIds = mappings.map((m) => m.user_id).filter((uid) => uid != null);
        if (userIds.length) {
          await this.userModel.update(
            { status: false },
            { where: { id: userIds }, transaction },
          );
        }
      }

      // Requirement: If corporate becomes Active again, do NOT auto-activate users (manual enable only).

      await transaction.commit();
      return updated;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    const corporate = await this.findOne(id);
    await corporate.destroy();
  }


  async findAll(): Promise<Corporate[]> {
    return this.corporateModel.findAll({
      include: [{ model: User, as: 'users', attributes: ['id', 'username', 'email'] }],
    });
  }

  /** Get all corporate users with full user details and corporate name */
  async getAllCorporateUsers(): Promise<any[]> {
    const corporateUsers = await this.corporateUserModel.findAll({
      include: [
        {
          model: User,
          attributes: { exclude: ['password'] },
        },
        {
          model: Corporate,
          attributes: ['id', 'name', 'status'],
        },
        {
          model: Center,
          attributes: ['id', 'project_name'],
        },
      ],
    });
    return corporateUsers.map((cu) => {
      const plain = cu.get({ plain: true });
      return {
        corporateUserId: plain.id,
        corporateId: plain.corporate_id,
        corporateName: plain.corporate?.name,
        corporateStatus: plain.corporate?.status,
        centerId: plain.center_id,
        centerName: plain.center?.project_name,
        isActive: plain.isActive,
        user: plain.user,
      };
    });
  }
}
