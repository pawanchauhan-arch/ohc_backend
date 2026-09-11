import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { Center } from '../../models/Center';
import { SpocDetailsDto, CetSpocDto, ClientSpocDto } from './dto/spoc-details.dto';

@Injectable()
export class SpocManagementService {
  constructor(
    @InjectModel(CETMANAGEMENT)
    private cetManagementModel: typeof CETMANAGEMENT,
    @InjectModel(Center)
    private centerModel: typeof Center,
  ) {}

  /**
   * Get SPOC details for both CET and Client
   */
  async getSpocDetails(cetId: number, centerId: number): Promise<SpocDetailsDto> {
    const [cetSpoc, clientSpoc] = await Promise.all([
      this.getCetSpocDetails(cetId),
      this.getClientSpocDetails(centerId),
    ]);

    return {
      cetSpoc,
      clientSpoc,
    };
  }

  /**
   * Get CET SPOC details
   */
  async getCetSpocDetails(cetId: number): Promise<CetSpocDto> {
    const cet = await this.cetManagementModel.findByPk(cetId);

    if (!cet) {
      throw new NotFoundException(`CET with ID ${cetId} not found`);
    }

    return {
      name: cet.spocName || '',
      email: cet.spocEmail || '',
      whatsapp: cet.spocWhatsappNumber || '',
      alternateName: cet.alternateSpocName || undefined,
      alternateEmail: cet.alternateSpocEmail || undefined,
      alternateWhatsapp: cet.alternateSpocContactNumber || undefined,
    };
  }

  /**
   * Get Client SPOC details
   */
  async getClientSpocDetails(centerId: number): Promise<ClientSpocDto> {
    const center = await this.centerModel.findByPk(centerId);

    if (!center) {
      throw new NotFoundException(`Center with ID ${centerId} not found`);
    }

    return {
      name: center.client_spoc_name || '',
      email: center.client_spoc_email || '',
      whatsapp: center.client_spoc_whatsapp || '',
      clientName: center.client_name || '',
      clientAddress: center.client_address || '',
      clientContact: center.client_contact || '',
    };
  }

  /**
   * Get SPOC details by health checkup ID
   */
  async getSpocDetailsByHealthCheckupId(healthCheckupId: number): Promise<SpocDetailsDto> {
    // This would need to be implemented based on how health checkup data is structured
    // For now, this is a placeholder that would need the health checkup service
    throw new Error('Method not implemented - requires health checkup service integration');
  }

  /**
   * Validate SPOC contact information
   */
  async validateSpocContacts(cetId: number, centerId: number): Promise<{
    cetValid: boolean;
    clientValid: boolean;
    issues: string[];
  }> {
    const issues: string[] = [];
    let cetValid = true;
    let clientValid = true;

    try {
      const cetSpoc = await this.getCetSpocDetails(cetId);
      
      if (!cetSpoc.email && !cetSpoc.whatsapp) {
        issues.push('CET SPOC has no valid contact information');
        cetValid = false;
      }
    } catch (error) {
      issues.push('CET SPOC details not found');
      cetValid = false;
    }

    try {
      const clientSpoc = await this.getClientSpocDetails(centerId);
      
      if (!clientSpoc.email && !clientSpoc.whatsapp) {
        issues.push('Client SPOC has no valid contact information');
        clientValid = false;
      }
    } catch (error) {
      issues.push('Client SPOC details not found');
      clientValid = false;
    }

    return {
      cetValid,
      clientValid,
      issues,
    };
  }
}
