import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Organization } from '../../models/Organization';
import { Center } from '../../models/Center';
import {ApiResponse, OrganizationDTO} from './Organization.dto';
import { or } from 'sequelize';


@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization)
    private readonly organizationModel: typeof Organization,
    @InjectModel(Center)
    private readonly centerModel: typeof Center,
  ) {}

  /**
   * Create a new organization
   */
  
  async createOrganization(
    data: Partial<Organization>,
  ): Promise<Organization | ApiResponse<null>> {
    try {
      const lastId = await this.organizationModel.count();
      data['organization_id'] = lastId + 1;

      const organization = await this.organizationModel.create(data);

      if (data.centerIds && data.centerIds.length > 0) {
        const centers = await this.centerModel.findAll({
          where: { id: data.centerIds },
        });
        // Optional: Validate all provided centerIds exist
        if (centers.length !== data.centerIds.length) {
          throw new NotFoundException('One or more centers not found');
        }

        // Set associations in the junction table
        await organization.$set('centerIds', centers);
      }

      return {
        status: true,
        code: 200,
        data: null,
        message: 'Organization created successfully',
      };
    } catch (error) {
      console.error('Error creating organization:', error);
      return {
        status: false,
        code: 500,
        data: null,
        message: 'Failed to create organization',
      };
    }
  }

  /**
   * Get all organizations (explicitly typed)
   */
  async getAllOrganization(): Promise<ApiResponse<OrganizationDTO[]>> {
    try {
      const organizations = await this.organizationModel.findAll({
        attributes: [
          ['organization_id', 'organization_id'],
          ['organization_name', 'organization_name'],
          ['email', 'email'],
          ['contact_number', 'contact_number'],
        ],include: [{ 
          model: Center, 
          through: { attributes: [] }, // Exclude junction table fields
          attributes: ['id', 'project_name' /* Add other Center attributes as needed */],
        }],
        raw: false,
        nest: true,
      });

      
      // Explicit transformation to DTO
      const result: OrganizationDTO[] = organizations.map((org) => ({
        organization_id: org['organization_id'],
        organization_name: org['organization_name'],
        email: org['email'],
        contact_number: org['contact_number'],
        centers:  (org['centerIds'] || []).map((center) => ({
          center_id: center.id,
          project_name: center.project_name,
        })),
      }));

      return {
        status: true,
        code: 200,
        data: result,
        message: 'Organizations retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching organizations:', error);
      return {
        status: false,
        code: 500,
        data: [],
        message: 'Failed to fetch organizations',
      };
    }
  }


  async getOrganizationById(id: number): Promise<ApiResponse<OrganizationDTO>> {
    try {
      const organization = await this.organizationModel.findOne({
        where: { organization_id: id },
        attributes: [
          ['organization_id', 'organization_id'],
          ['organization_name', 'organization_name'],
          ['email', 'email'],
          ['contact_number', 'contact_number'],
        ],
        include: [{ 
          model: Center, 
          through: { attributes: [] }, // Exclude junction table fields
          attributes: ['id', 'project_name' /* Add other Center attributes as needed */],
        }],
        raw: false,
        nest: true,
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      const result: OrganizationDTO = {
        organization_id: organization['organization_id'],
        organization_name: organization['organization_name'],
        email: organization['email'],
        contact_number: organization['contact_number'],
        centers: (organization['centerIds'] || []).map((center) => ({
          center_id: center.id,
          project_name: center.project_name,
        })),
      };

      return {
        status: true,
        code: 200,
        data: result,
        message: 'Organization retrieved successfully',
      };
    } catch (error) {
      console.error('Error fetching organization:', error);
      return {
        status: false,
        code: 500,
        data: null,
        message: 'Failed to fetch organization',
      };
    }
  }


  async updateOrganization( data: Partial<Organization>): Promise<ApiResponse<OrganizationDTO[]>> {
    try {
      const organization = await this.organizationModel.update({
        organization_name: data.organization_name,
        email: data.email,
        contact_number: data.contact_number,
      }, {
        where: { organization_id: data.id },
      });

      const org = await this.organizationModel.findOne({
        where: { organization_id: data.id },
      });

      if (!organization) {
        throw new NotFoundException('Organization not found');
      }

      if (data.centerIds !== undefined) {
        const centers = data.centerIds && data.centerIds.length > 0
          ? await this.centerModel.findAll({ where: { id: data.centerIds } })
          : [];
        
        // Optional: Validate all provided centerIds exist
        if (centers.length !== data.centerIds.length && data.centerIds.length > 0) {
          throw new NotFoundException('One or more centers not found');
        }
      
        // This $set replaces previous associations: deletes old relations and adds new ones
        await org.$set('centerIds', centers);
      }


      return {
        status: true,
        code: 200,
        data: null,
        message: 'Organization updated successfully',
      };
    } catch (error) {
      console.error('Error updating organization:', error);
      return {
        status: false,
        code: 500,
        data: null,
        message: 'Failed to update organization',
      };
    }
  }

}
