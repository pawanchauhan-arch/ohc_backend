import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Corporate } from '../../models/corporate';
import { Center } from '../../models/Center';
import { GetCentersDto, CentersListResponseDto, CenterResponseDto } from './dto/get-centers.dto';

@Injectable()
export class CenterService {
  constructor(
    @InjectModel(CETMANAGEMENT) private cetManagementModel: typeof CETMANAGEMENT,
    @InjectModel(Corporate) private corporateModel: typeof Corporate,
    @InjectModel(Center) private centerModel: typeof Center,
  ) {}

  /**
   * Get all centers mapped to a CET or Corporate ID
   * @param dto - Contains id and roleType ('cet' or 'corporate')
   * @returns List of centers with id and project_name only
   */
  async getCentersByRole(dto: GetCentersDto): Promise<CentersListResponseDto> {
    console.log('[getCentersByRole] Starting - Input:', JSON.stringify(dto));
    const roleType = dto.roleType?.toLowerCase().trim();
    console.log('[getCentersByRole] Normalized roleType:', roleType);
    let centerIds: number[] = [];

    if (roleType === 'cet') {
      console.log('[getCentersByRole] Processing CET with ID:', dto.id);
      // Get centers for CET from center_ids_array column
      centerIds = await this.getCetCenterIds(dto.id);
      console.log('[getCentersByRole] CET centerIds retrieved:', centerIds);
    } else if (roleType === 'corporate') {
      console.log('[getCentersByRole] Processing Corporate with ID:', dto.id);
      // Get centers for Corporate from center_ids column
      centerIds = await this.getCorporateCenterIds(dto.id);
      console.log('[getCentersByRole] Corporate centerIds retrieved:', centerIds);
    } else {
      console.error('[getCentersByRole] Invalid roleType:', dto.roleType);
      throw new BadRequestException(
        `Invalid roleType: ${dto.roleType}. Must be 'cet' or 'corporate'`,
      );
    }

    if (centerIds.length === 0) {
      console.log('[getCentersByRole] No center IDs found, returning empty array');
      return { centers: [] };
    }

    console.log('[getCentersByRole] Fetching centers with IDs:', centerIds);
    // Fetch centers with only id and project_name
    const centers = await this.centerModel.findAll({
      where: {
        id: {
          [Op.in]: centerIds,
        },
      },
      attributes: ['id', 'project_name'],
    });

    console.log('[getCentersByRole] Centers found:', centers.length);

    const centerDtos: CenterResponseDto[] = centers.map((center) => ({
      id: center.id,
      project_name: center.project_name,
    }));

    console.log('[getCentersByRole] Returning centers:', centerDtos.length);
    return { centers: centerDtos };
  }

  /**
   * Get all center IDs for a CET
   * Returns centers from CETMANAGEMENT.center_ids_array
   */
  private async getCetCenterIds(cetId: number): Promise<number[]> {
    console.log('[getCetCenterIds] Fetching CET with ID:', cetId);
    try {
      // Only select columns that exist in DB - exclude center_ids which doesn't exist
      const cet = await this.cetManagementModel.findByPk(cetId, {
        attributes: ['id', 'center_ids_array'], // Explicitly exclude center_ids column
      });
      console.log('[getCetCenterIds] CET found:', cet ? 'Yes' : 'No');
      
      if (!cet) {
        console.error('[getCetCenterIds] CET not found with ID:', cetId);
        throw new NotFoundException(`CET with ID ${cetId} not found`);
      }

      console.log('[getCetCenterIds] CET data:', {
        id: cet.id,
        center_ids_array: cet.center_ids_array,
        hasCenterIdsArray: !!cet.center_ids_array,
      });

      const centerIds = cet.center_ids_array as number[] | null | undefined;
      if (!centerIds || centerIds.length === 0) {
        console.log('[getCetCenterIds] No center IDs in center_ids_array');
        return [];
      }

      console.log('[getCetCenterIds] Returning center IDs:', centerIds);
      return centerIds;
    } catch (error) {
      console.error('[getCetCenterIds] Error fetching CET:', error);
      throw error;
    }
  }

  /**
   * Get all center IDs for a Corporate
   * Returns centers from Corporate.center_ids array
   */
  private async getCorporateCenterIds(corporateId: number): Promise<number[]> {
    console.log('[getCorporateCenterIds] Fetching Corporate with ID:', corporateId);
    try {
      const corporate = await this.corporateModel.findByPk(corporateId);
      console.log('[getCorporateCenterIds] Corporate found:', corporate ? 'Yes' : 'No');
      
      if (!corporate) {
        console.error('[getCorporateCenterIds] Corporate not found with ID:', corporateId);
        throw new NotFoundException(`Corporate with ID ${corporateId} not found`);
      }

      console.log('[getCorporateCenterIds] Corporate data:', {
        id: corporate.id,
        center_ids: corporate.center_ids,
        hasCenterIds: !!corporate.center_ids,
      });

      const centerIds = corporate.center_ids as number[] | null | undefined;
      if (!centerIds || centerIds.length === 0) {
        console.log('[getCorporateCenterIds] No center IDs in center_ids');
        return [];
      }

      console.log('[getCorporateCenterIds] Returning center IDs:', centerIds);
      return centerIds;
    } catch (error) {
      console.error('[getCorporateCenterIds] Error fetching Corporate:', error);
      throw error;
    }
  }
}