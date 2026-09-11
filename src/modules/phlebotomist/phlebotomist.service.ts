import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import * as bcrypt from 'bcryptjs';
import { CenterUser } from '../../models/CenterUser';
import { User } from '../../models/User';
import { Center } from '../../models/Center';
import { CampList } from '../../models/CampList';
import { CampListItem } from '../../models/CampListItem';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { CreatePhlebotomistDto, UpdatePhlebotomistDto, AssignPhlebotomistDto } from './dto/index';
import { uploadToS3WithFolder } from '../../utils/s3-image-upload';
const BUCKET_NAME_PHLEBOTOMIST = process.env.BUCKET_NAME_PHLEBOTOMIST;
/**
 * Service for managing phlebotomists and their camp assignments
 */
@Injectable()
export class PhlebotomistService {
  constructor(
    @InjectModel(CenterUser) private readonly centerUserModel: typeof CenterUser,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Center) private readonly centerModel: typeof Center,
    @InjectModel(CampList) private readonly campListModel: typeof CampList,
    @InjectModel(CampListItem) private readonly campListItemModel: typeof CampListItem,
    @InjectModel(DRIVERMASTER) private readonly driverModel: typeof DRIVERMASTER,
  ) {}

  /**
   * Safely parse assigned_phlebotomist_ids to ensure it's a proper array
   */
  private parsePhlebotomistIds(assignedIds: any): number[] {
    if (!assignedIds) {
      return [];
    }
    
    if (Array.isArray(assignedIds)) {
      return assignedIds;
    }
    
    if (typeof assignedIds === 'string') {
      try {
        return JSON.parse(assignedIds);
      } catch (error) {
        console.warn('Failed to parse assigned_phlebotomist_ids:', error);
        return [];
      }
    }
    
    return [];
  }

  /**
   * Keep camp_list.statusSamplify in sync when phlebotomists are assigned/unassigned
   * from the center portal (same status used by Samplify camp processor).
   */
  private syncCampPhleboStatus(camp: CampList, assignedCount: number): void {
    if (assignedCount > 0) {
      camp.statusSamplify = 'PHLEBO_ASSIGNED';
    } else if (assignedCount === 0 && camp.statusSamplify === 'PHLEBO_ASSIGNED') {
      camp.statusSamplify = 'CAMP_CREATED';
    }
  }

  /**
   * Generate a unique email for phlebotomist
   */
  private async generatePhlebotomistEmail(centerId: number): Promise<string> {
    const center = await this.centerModel.findByPk(centerId);
    const centerName = center?.project_name || center?.agency_name || `center${centerId}`;
    
    // Clean center name for email (remove spaces, special chars, convert to lowercase)
    const cleanCenterName = centerName.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    // Get count of existing phlebotomists for this center
    const existingPhlebotomists = await this.centerUserModel.count({
      where: {
        center_id: BigInt(centerId),
        user_type: 'PHLEBO'
      }
    });
    
    // Generate email with format: phlebo{number}@{centername}.com
    const emailNumber = existingPhlebotomists + 1;
    let email = `phlebo${emailNumber}@${cleanCenterName}.com`;
    
    // Ensure email is unique
    let counter = 1;
    while (await this.userModel.findOne({ where: { email } })) {
      email = `phlebo${emailNumber}_${counter}@${cleanCenterName}.com`;
      counter++;
    }
    
    return email;
  }

  /**
   * Generate unique employee code for phlebotomist
   */
  private async generateEmployeeCode(centerId: number): Promise<string> {
    // Get center short code for prefix
    const center = await this.centerModel.findByPk(centerId);
    const centerPrefix = center?.center_shortcode || 'CEN';
    
    // Get count of existing phlebotomists for this center
    const existingCount = await this.centerUserModel.count({
      where: {
        center_id: BigInt(centerId),
        user_type: 'PHLEBO'
      }
    });
    
    // Generate employee code: CENTER_PREFIX + PHLEBO + SEQUENCE
    const sequence = String(existingCount + 1).padStart(3, '0');
    return `${centerPrefix}_PHLEBO_${sequence}`;
  }

  /**
   * Create a new phlebotomist for a center
   */
  async createPhlebotomist(data: CreatePhlebotomistDto, centerIdScope: number): Promise<CenterUser> {
    // Use provided center_id or fallback to centerIdScope
    const centerId = data.center_id || centerIdScope;
    
    // Validate center access
    if (data.center_id && data.center_id !== centerIdScope) {
      throw new ForbiddenException('Cannot create phlebotomist for different center');
    }

    // Check if center exists
    const center = await this.centerModel.findByPk(centerId);
    if (!center) {
      throw new NotFoundException('Center not found');
    }

    // Generate defaults for missing required fields
    const timestamp = Date.now();
    const defaultUsername = data.username || `phlebo_${timestamp}`;
    const defaultName = data.name || 'Phlebotomist';
    
    // Auto-generate email with proper format
    const generatedEmail = await this.generatePhlebotomistEmail(centerId);
    
    // Hardcoded password for all phlebotomists - hash it with bcrypt
    const plainPassword = 'Phlebo@123';
    const hashedPassword = bcrypt.hashSync(plainPassword, 8);
    
    const defaultPhone = data.phone || '+919999999999';
    
    // Generate employee code if not provided
    const employeeCode = data.employee_code || await this.generateEmployeeCode(centerId);

    // Check if username already exists (only if provided)
    if (data.username) {
      const existingUser = await this.userModel.findOne({ where: { username: data.username } });
      if (existingUser) {
        throw new BadRequestException('Username already exists');
      }
    }

    // Email is auto-generated, no need to check for existing email

    // Check if phone number already exists (only if provided)
    if (data.phone) {
      const existingPhone = await this.userModel.findOne({ where: { phone: data.phone } });
      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }
    }

    // Check if employee code already exists (only if provided)
    if (data.employee_code) {
      const existingEmployeeCode = await this.centerUserModel.findOne({
        where: { short_code: data.employee_code }
      });
      if (existingEmployeeCode) {
        throw new BadRequestException('Employee code already exists');
      }
    }

    // Create user with role_id = 2 (phlebotomist role)
    const user = await this.userModel.create({
      username: defaultUsername,
      name: defaultName,
      role_id: 2, // Phlebotomist role
      permission_id: 1, // Default permission
      email: generatedEmail,
      password: hashedPassword,
      phone: defaultPhone,
      isAdmin: false,
      status: true,
      external_id: `phlebo_${timestamp}`,
    });

    // Create center user relationship
    const centerUser = await this.centerUserModel.create({
      user_id: user.id,
      center_id: BigInt(centerId),
      user_type: 'PHLEBO',
      signature: data.signature || null,
      short_code: employeeCode,
    });

    // Manually set the user relationship to avoid database query issues
    centerUser.user = user;
    
    return centerUser;
  }

  /**
   * List all phlebotomists for a center
   */
  async listPhlebotomists(centerIdScope: number): Promise<CenterUser[]> {
    return this.centerUserModel.findAll({
      where: { 
        center_id: BigInt(centerIdScope),
        user_type: 'PHLEBO'
      },
      include: [{ model: User, as: 'user' }, { model: Center, as: 'center' }],
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Search phlebotomists by phone number or employee code
   */
  async searchPhlebotomists(centerIdScope: number, phone?: string, employeeCode?: string): Promise<CenterUser[]> {
    const { Op } = require('sequelize');
    
    const whereConditions: any = {
      center_id: BigInt(centerIdScope),
      user_type: 'PHLEBO'
    };

    const includeConditions: any = [
      { model: User, as: 'user' }, 
      { model: Center, as: 'center' }
    ];

    // If searching by phone, add phone condition to user include
    if (phone) {
      includeConditions[0] = {
        model: User,
        as: 'user',
        where: { phone: phone }
      };
    }

    // If searching by employee code, add it to main where conditions
    if (employeeCode) {
      whereConditions.short_code = employeeCode;
    }

    // If both phone and employee code are provided, use OR condition
    if (phone && employeeCode) {
      whereConditions[Op.or] = [
        { short_code: employeeCode },
        { '$user.phone$': phone }
      ];
      // Reset individual conditions
      delete whereConditions.short_code;
      includeConditions[0] = { model: User, as: 'user' };
    }

    return this.centerUserModel.findAll({
      where: whereConditions,
      include: includeConditions,
      order: [['createdAt', 'DESC']],
    });
  }

  /**
   * Get phlebotomist details
   */
  async getPhlebotomist(phlebotomistId: number, centerIdScope: number): Promise<CenterUser> {
    const phlebotomist = await this.centerUserModel.findByPk(phlebotomistId, {
      include: [{ model: User, as: 'user' }, { model: Center, as: 'center' }],
    });

    if (!phlebotomist || Number(phlebotomist.center_id) !== centerIdScope || phlebotomist.user_type !== 'PHLEBO') {
      throw new NotFoundException('Phlebotomist not found');
    }

    return phlebotomist;
  }

  /**
   * Update phlebotomist details
   */
  async updatePhlebotomist(phlebotomistId: number, centerIdScope: number, data: UpdatePhlebotomistDto): Promise<CenterUser> {
    const phlebotomist = await this.centerUserModel.findByPk(phlebotomistId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!phlebotomist || Number(phlebotomist.center_id) !== centerIdScope || phlebotomist.user_type !== 'PHLEBO') {
      throw new NotFoundException('Phlebotomist not found');
    }

    // Update user details
    const user = phlebotomist.user;
    if (data.name) user.name = data.name;
    if (data.email) {
      // Check if email already exists for another user
      const existingEmail = await this.userModel.findOne({ 
        where: { email: data.email, id: { [Symbol.for('ne')]: user.id } } 
      });
      if (existingEmail) {
        throw new BadRequestException('Email already exists');
      }
      user.email = data.email;
    }
    if (data.password) user.password = data.password;
    if (data.phone) {
      // Check if phone number already exists for another user
      const existingPhone = await this.userModel.findOne({ 
        where: { phone: data.phone, id: { [Symbol.for('ne')]: user.id } } 
      });
      if (existingPhone) {
        throw new BadRequestException('Phone number already exists');
      }
      user.phone = data.phone;
    }
    if (typeof data.status === 'boolean') user.status = data.status;

    await user.save();

    // Update center user details
    if (data.signature !== undefined) phlebotomist.signature = data.signature;
    if (data.employee_code !== undefined) {
      // Check if employee code already exists for another phlebotomist
      const existingEmployeeCode = await this.centerUserModel.findOne({
        where: { 
          short_code: data.employee_code,
          id: { [Symbol.for('ne')]: phlebotomist.id }
        }
      });
      if (existingEmployeeCode) {
        throw new BadRequestException('Employee code already exists');
      }
      phlebotomist.short_code = data.employee_code;
    }
    await phlebotomist.save();

    return this.getPhlebotomist(phlebotomistId, centerIdScope);
  }

  /**
   * Delete phlebotomist
   */
  async deletePhlebotomist(phlebotomistId: number, centerIdScope: number): Promise<void> {
    const phlebotomist = await this.centerUserModel.findByPk(phlebotomistId, {
      include: [{ model: User, as: 'user' }],
    });

    if (!phlebotomist || Number(phlebotomist.center_id) !== centerIdScope || phlebotomist.user_type !== 'PHLEBO') {
      throw new NotFoundException('Phlebotomist not found');
    }

    // Check if phlebotomist is assigned to any camps
    const assignedCamps = await this.campListModel.findAll({
      where: {
        center_id: centerIdScope,
        assigned_phlebotomist_ids: {
          [Symbol.for('contains')]: [phlebotomistId]
        }
      }
    });

    if (assignedCamps.length > 0) {
      throw new BadRequestException('Cannot delete phlebotomist assigned to active camps');
    }

    // Delete center user relationship
    await phlebotomist.destroy();
    
    // Delete user
    await phlebotomist.user.destroy();
  }

  /**
   * Assign phlebotomists to a camp
   */
  async assignPhlebotomistsToCamp(campId: number, centerIdScope: number, data: AssignPhlebotomistDto): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Validate all phlebotomist IDs belong to the center
    const phlebotomists = await this.centerUserModel.findAll({
      where: {
        id: data.phlebotomist_ids,
        center_id: BigInt(centerIdScope),
        user_type: 'PHLEBO'
      }
    });

    if (phlebotomists.length !== data.phlebotomist_ids.length) {
      throw new BadRequestException('One or more phlebotomists not found or invalid');
    }

    // Update camp with assigned phlebotomist IDs
    camp.assigned_phlebotomist_ids = data.phlebotomist_ids;
    this.syncCampPhleboStatus(camp, data.phlebotomist_ids.length);
    await camp.save();

    return camp;
  }

  /**
   * Add phlebotomists to a camp (additive - doesn't replace existing)
   */
  async addPhlebotomistsToCamp(campId: number, centerIdScope: number, data: AssignPhlebotomistDto): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Get current assigned phlebotomist IDs
    const currentPhlebotomistIds = this.parsePhlebotomistIds(camp.assigned_phlebotomist_ids);

    // Validate all new phlebotomist IDs belong to the center
    const phlebotomists = await this.centerUserModel.findAll({
      where: {
        id: data.phlebotomist_ids,
        center_id: BigInt(centerIdScope),
        user_type: 'PHLEBO'
      }
    });

    if (phlebotomists.length !== data.phlebotomist_ids.length) {
      throw new BadRequestException('One or more phlebotomists not found or invalid');
    }

    // Combine existing and new phlebotomist IDs (avoid duplicates)
    const combinedIds = [...new Set([...currentPhlebotomistIds, ...data.phlebotomist_ids])];

    // Update camp with combined phlebotomist IDs
    camp.assigned_phlebotomist_ids = combinedIds;
    this.syncCampPhleboStatus(camp, combinedIds.length);
    await camp.save();

    return camp;
  }

  /**
   * Add phlebotomists to a camp using employee codes (additive - doesn't replace existing)
   */
  async addPhlebotomistsToCampByCode(campId: number, centerIdScope: number, data: { employee_codes: string[] }): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Get current assigned phlebotomist IDs
    const currentPhlebotomistIds = this.parsePhlebotomistIds(camp.assigned_phlebotomist_ids);

    // Find phlebotomists by employee codes
    const phlebotomists = await this.centerUserModel.findAll({
      where: {
        short_code: data.employee_codes,
        center_id: BigInt(centerIdScope),
        user_type: 'PHLEBO'
      }
    });

    if (phlebotomists.length !== data.employee_codes.length) {
      throw new BadRequestException('One or more phlebotomists not found with provided employee codes');
    }

    // Extract phlebotomist IDs
    const newPhlebotomistIds = phlebotomists.map(p => p.id);

    // Combine existing and new phlebotomist IDs (avoid duplicates)
    const combinedIds = [...new Set([...currentPhlebotomistIds, ...newPhlebotomistIds])];

    // Update camp with combined phlebotomist IDs
    camp.assigned_phlebotomist_ids = combinedIds;
    this.syncCampPhleboStatus(camp, combinedIds.length);
    await camp.save();

    return camp;
  }

  /**
   * Assign phlebotomists to a camp using employee codes
   */
  async assignPhlebotomistsToCampByCode(campId: number, centerIdScope: number, data: { employee_codes: string[] }): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Find phlebotomists by employee codes
    const phlebotomists = await this.centerUserModel.findAll({
      where: {
        short_code: data.employee_codes,
        center_id: BigInt(centerIdScope),
        user_type: 'PHLEBO'
      }
    });

    if (phlebotomists.length !== data.employee_codes.length) {
      const foundCodes = phlebotomists.map(p => p.short_code);
      const missingCodes = data.employee_codes.filter(code => !foundCodes.includes(code));
      throw new BadRequestException(`Phlebotomists with employee codes not found: ${missingCodes.join(', ')}`);
    }

    // Extract phlebotomist IDs
    const phlebotomistIds = phlebotomists.map(p => p.id);

    // Update camp with assigned phlebotomist IDs
    camp.assigned_phlebotomist_ids = phlebotomistIds;
    this.syncCampPhleboStatus(camp, phlebotomistIds.length);
    await camp.save();

    return camp;
  }

  /**
   * Get assigned phlebotomists for a camp
   */
  async getCampPhlebotomists(campId: number, centerIdScope: number): Promise<CenterUser[]> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Ensure assigned_phlebotomist_ids is a proper array
    const phlebotomistIds = this.parsePhlebotomistIds(camp.assigned_phlebotomist_ids);

    if (phlebotomistIds.length === 0) {
      return [];
    }

    return this.centerUserModel.findAll({
        where: {
          id: {
            [Op.in]: phlebotomistIds
          },
          center_id: BigInt(centerIdScope),
          user_type: 'PHLEBO'
        },
      include: [{ model: User, as: 'user' }],
    });
  }

  /**
   * Unassign phlebotomist from camp
   */
  async unassignPhlebotomistFromCamp(campId: number, phlebotomistId: number, centerIdScope: number): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Ensure assigned_phlebotomist_ids is a proper array
    const phlebotomistIds = this.parsePhlebotomistIds(camp.assigned_phlebotomist_ids);

    // Remove phlebotomist from assigned list
    const updatedIds = phlebotomistIds.filter(id => id !== phlebotomistId);
    camp.assigned_phlebotomist_ids = updatedIds;
    this.syncCampPhleboStatus(camp, updatedIds.length);
    await camp.save();

    return camp;
  }

  /**
   * Get camps assigned to a phlebotomist
   */
  async getPhlebotomistCamps(phlebotomistId: number, centerIdScope: number): Promise<CampList[]> {
    // Verify phlebotomist exists and belongs to center
    const phlebotomist = await this.centerUserModel.findByPk(phlebotomistId);
    if (!phlebotomist || Number(phlebotomist.center_id) !== centerIdScope || phlebotomist.user_type !== 'PHLEBO') {
      throw new NotFoundException('Phlebotomist not found');
    }

    return this.campListModel.findAll({
      where: {
        center_id: centerIdScope,
        assigned_phlebotomist_ids: {
          [Symbol.for('contains')]: [phlebotomistId]
        }
      },
      order: [['scheduled_on', 'DESC']],
    });
  }

  /**
   * Get specific camp details for phlebotomist
   */
  async getPhlebotomistCamp(campId: number, phlebotomistId: number, centerIdScope: number): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId, {
      include: ['items']
    });

    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    // Ensure assigned_phlebotomist_ids is a proper array and check assignment
    const phlebotomistIds = this.parsePhlebotomistIds(camp.assigned_phlebotomist_ids);

    if (!phlebotomistIds.includes(phlebotomistId)) {
      throw new ForbiddenException('Phlebotomist not assigned to this camp');
    }

    return camp;
  }

  /**
   * Get phlebotomist by phone number
   */
  async getPhlebotomistByPhoneNumber(phoneNumber: string): Promise<CenterUser & { name?: string }> {
    console.log('Service - Phone Number:', phoneNumber);

    // First, find the user by phone number
    const user = await this.userModel.findOne({
      where: { phone: phoneNumber },
      attributes: ['id', 'username', 'name', 'email', 'phone', 'role_id', 'status'],
    });

    if (!user) {
      throw new NotFoundException(
        `User with phone number ${phoneNumber} not found`,
      );
    }

    console.log('Found user:', user.id, user.username);

    // Then, check if this user has a phlebotomist record in CenterUser
    const phlebotomist = await this.centerUserModel.findOne({
      where: { 
        user_id: user.id,
        user_type: 'PHLEBO'
      },
      include: [
        {
          model: this.userModel,
          as: 'user',
          attributes: ['username', 'id', 'name', 'email', 'phone', 'role_id', 'status'],
        },
      ],
    });

    if (!phlebotomist) {
      throw new NotFoundException(
        `User with phone number ${phoneNumber} is not a phlebotomist`,
      );
    }

    // Debug logging
    console.log('Phlebotomist user_id:', phlebotomist.user_id);
    console.log('Phlebotomist user object:', JSON.stringify(phlebotomist.user, null, 2));

    // Create a response object that includes the phlebotomist data and the name from the user
    const response = phlebotomist.toJSON();
    
    // // Check if user exists and has a name property
    // if (phlebotomist.user && phlebotomist.user.name) {
    //   response.name = phlebotomist.user.name;
    //   console.log('Setting phlebotomist name to:', phlebotomist.user.name);
    // } else if (phlebotomist.user && phlebotomist.user.username) {
    //   response.name = phlebotomist.user.username;
    //   console.log('Setting phlebotomist name to username:', phlebotomist.user.username);
    // } else {
    //   // If user relation is not loaded properly, use the user we already fetched
    //   console.log('User relation not loaded properly, using already fetched user');
    //   if (user.name) {
    //     response.name = user.name;
    //     console.log('Retrieved name from already fetched user:', user.name);
    //   } else if (user.username) {
    //     response.name = user.username;
    //     console.log('Retrieved username from already fetched user:', user.username);
    //   } else {
    //     console.log('User not found or name is null for user_id:', user.id);
    //   }
    // }

    return response;
  }

  /**
   * Get camp items assigned to a phlebotomist with patient details
   */
  async getPhlebotomistCampItems(phlebotomistId: number): Promise<Array<{
    camp: CampList;
    items: Array<{
      item: {
        camp_id: number;
        total_patients: number;
        camp_scheduled_on: string;
        camp_location: string | null;
        camp_is_completed: boolean;
      };
      patient: DRIVERMASTER[];
    }>;
  }>> {
    console.log('Service - Phlebotomist ID:', phlebotomistId);

    // First, verify the phlebotomist exists
    const phlebotomist = await this.centerUserModel.findByPk(phlebotomistId);

    if (!phlebotomist || phlebotomist.user_type !== 'PHLEBO') {
      throw new NotFoundException(
        `Phlebotomist with ID ${phlebotomistId} not found`,
      );
    }

    console.log('Found phlebotomist:', phlebotomistId);

    // Find all camps assigned to this phlebotomist
    const assignedCamps = await this.campListModel.findAll({
      where: {
        assigned_phlebotomist_ids: {
          [Op.contains]: [phlebotomistId]
        }
      },
      order: [['scheduled_on', 'DESC']],
    });

    console.log(`Found ${assignedCamps.length} camps assigned to phlebotomist`);

    // For each camp, get the camp items with patient details
    const campsWithItems = await Promise.all(
      assignedCamps.map(async (camp) => {
        const campItems = await this.campListItemModel.findAll({
          where: { camp_id: camp.id },
          include: [
            {
              model: this.driverModel,
              as: 'driver',
              attributes: [
                'id', 'name', 'healthCardNumber', 'abhaNumber', 'dateOfBirthOrAge',
                'gender', 'photographOfDriver', 'localAddress', 'localAddressDistrict',
                'localAddressState', 'contactNumber', 'emergencyContactName',
                'emergencyContactNumber', 'idProof_name', 'idProof', 'idProof_number',
                'blood_group', 'preferred_language', 'isBanned'
              ],
            },
          ],
          order: [['createdAt', 'ASC']],
        });

        console.log(`Camp ${camp.id} has ${campItems.length} items`);

        // Group all patients from this camp into a single item
        const patients = campItems.map(item => item.driver);
        
        return {
          camp,
          items: [
            {
              item: {
                camp_id: camp.id,
                total_patients: campItems.length,
                camp_scheduled_on: camp.scheduled_on,
                camp_location: camp.location_text,
                camp_is_completed: camp.is_completed,
              },
              patient: patients,
            }
          ],
        };
      })
    );

    return campsWithItems;
  }

  async updatePhlebotomistImage(phlebotomistId: number, dob: string, idProof: Express.Multer.File, image: Express.Multer.File): Promise<CenterUser> {
    const phlebotomist = await this.centerUserModel.findByPk(phlebotomistId , {include: ['user']});
    if (!phlebotomist || phlebotomist.user_type !== 'PHLEBO') {
      throw new NotFoundException(
        `Phlebotomist with ID ${phlebotomistId} not found`,
      );
    }

    const folderPath = `${phlebotomist.user.name}_${phlebotomist.user.phone}`;

    let idProofUrl: string;
    try {
      idProofUrl = await uploadToS3WithFolder(idProof, BUCKET_NAME_PHLEBOTOMIST, folderPath);
      console.log('Image uploaded to S3:', idProofUrl);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException('Failed to upload image to S3: ' + error.message);
    }

    let imageUrl: string;
    try {
      imageUrl = await uploadToS3WithFolder(image, BUCKET_NAME_PHLEBOTOMIST, folderPath);
      console.log('Image uploaded to S3:', imageUrl);
    } catch (error) {
      console.error('S3 upload error:', error);
      throw new BadRequestException('Failed to upload image to S3: ' + error.message);
    }

    try {
      await phlebotomist.update({ phlebo_image: imageUrl , id_proof: idProofUrl, dob:dob, isregistered:true });
      return phlebotomist;
    } catch (error) {
      console.error('Failed to update phlebotomist image:', error);
      throw new BadRequestException('Failed to update phlebotomist image: ' + error.message);
    }
  }

}
