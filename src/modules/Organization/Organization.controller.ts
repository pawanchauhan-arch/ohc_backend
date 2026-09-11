import { Controller, Get, Post, Put, Delete, Param, Body, NotFoundException, Query } from '@nestjs/common';
import { OrganizationService } from './Organization.service';
import { Organization } from '../../models/Organization';
import { ApiResponse, OrganizationDTO } from './Organization.dto';

@Controller('api/organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('createOrganization')
  async createOrganization(@Body() organizationData: Partial<Organization>): Promise<Organization | ApiResponse<null>> {
    return this.organizationService.createOrganization(organizationData);
  }

  @Post('getAllOrganization')
  async getAllOrganization(): Promise<ApiResponse<OrganizationDTO[]>> {
    return this.organizationService.getAllOrganization();
  }

  @Post("getOrganizationById")
  async getOrganizationById(@Body() id: {id: number}): Promise<ApiResponse<OrganizationDTO>> {
    return this.organizationService.getOrganizationById(id.id);
  }

  @Post("updateOrganization")
  async updateOrganization(@Body() organizationData: Partial<Organization>): Promise<ApiResponse<OrganizationDTO[]>> {
    console.log(organizationData);
    return this.organizationService.updateOrganization(organizationData);
  }

  // @Post("deleteOrganization")
  // async deleteOrganization(@Body() id: {id: number}): Promise<Organization | ApiResponse<null>> {
  //   return this.organizationService.deleteOrganization(id.id);
  // }

}
