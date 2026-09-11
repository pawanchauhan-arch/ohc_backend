import { Injectable, BadRequestException } from '@nestjs/common';
import { QueryTypes, Sequelize } from 'sequelize';
import { InjectConnection } from '@nestjs/sequelize';

export interface LookupItem {
  id: number;
  name: string;
  parentId?: number;
  parentName?: string;
}

@Injectable()
export class LookupService {
  constructor(
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async getCountries(): Promise<LookupItem[]> {
    const rows = await this.sequelize.query<{ id: number; name: string }>(
      `SELECT id, name FROM countries  ORDER BY name`,
      { type: QueryTypes.SELECT },
    );
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  async getStates(countryId?: number): Promise<LookupItem[]> {
    const where = countryId ? 'WHERE s.country_id = :countryId' : '';
    const rows = await this.sequelize.query<{
      id: number;
      name: string;
      country_id: number;
      country_name: string;
    }>(
      `SELECT s.id, s.name, s.country_id, c.name AS country_name
       FROM states s
       JOIN countries c ON c.id = s.country_id
       ${where}
       ORDER BY c.name, s.name`,
      {
        replacements: { countryId },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      parentId: r.country_id,
      parentName: r.country_name,
    }));
  }

  async getDistricts(stateId?: number): Promise<LookupItem[]> {
    const where = stateId ? 'WHERE d.state_id = :stateId' : '';
    const rows = await this.sequelize.query<{
      id: number;
      name: string;
      state_id: number;
      state_name: string;
    }>(
      `SELECT d.id, d.name, d.state_id, s.name AS state_name
       FROM districts d
       JOIN states s ON s.id = d.state_id
       ${where}
       ORDER BY s.name, d.name`,
      {
        replacements: { stateId },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      parentId: r.state_id,
      parentName: r.state_name,
    }));
  }

  async getDepartments(center_id: number): Promise<LookupItem[]> {
    const rows = await this.sequelize.query<{ id: number; name: string }>(
      `SELECT id, name FROM department
       WHERE center_id = :center_id AND (is_active = true)
       ORDER BY name`,
      {
        replacements: { center_id: 2 },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  async getDesignations(center_id: number): Promise<LookupItem[]> {
    const rows = await this.sequelize.query<{ id: number; name: string }>(
      `SELECT id, name FROM designation
       WHERE center_id = :center_id AND (is_active = true)
       ORDER BY name`,
      {
        replacements: { center_id: 2 },
        type: QueryTypes.SELECT,
      },
    );
    return rows.map((r) => ({ id: r.id, name: r.name }));
  }

  /**
   * Resolve human-readable names to database IDs.
   * Case-insensitive matching with trim.
   */
  async resolveLocationIds(
    countryName: string,
    stateName: string,
    districtName: string,
  ): Promise<{ country_id: number; state_id: number; district_id: number }> {
    const normalize = (s: string) => s?.trim().toLowerCase() ?? '';

    const countries = await this.getCountries();
    const country = countries.find(
      (c) => normalize(c.name) === normalize(countryName),
    );
    if (!country) {
      throw new BadRequestException(`Country "${countryName}" not found`);
    }

    const states = await this.getStates(country.id);
    const state = states.find(
      (s) => normalize(s.name) === normalize(stateName),
    );
    if (!state) {
      throw new BadRequestException(
        `State "${stateName}" not found in country "${countryName}"`,
      );
    }

    const districts = await this.getDistricts(state.id);
    const district = districts.find(
      (d) => normalize(d.name) === normalize(districtName),
    );
    if (!district) {
      throw new BadRequestException(
        `District "${districtName}" not found in state "${stateName}"`,
      );
    }

    return {
      country_id: country.id,
      state_id: state.id,
      district_id: district.id,
    };
  }

  async resolveDepartmentId(
    tenantId: number,
    departmentName: string,
  ): Promise<number | undefined> {
    if (!departmentName?.trim()) return undefined;

    const departments = await this.getDepartments(tenantId);
    const dept = departments.find(
      (d) =>
        d.name.trim().toLowerCase() === departmentName.trim().toLowerCase(),
    );
    if (!dept) {
      throw new BadRequestException(`Department "${departmentName}" not found`);
    }
    return dept.id;
  }

  async resolveDesignationId(
    tenantId: number,
    designationName: string,
  ): Promise<number | undefined> {
    if (!designationName?.trim()) return undefined;

    const designations = await this.getDesignations(tenantId);
    const desig = designations.find(
      (d) =>
        d.name.trim().toLowerCase() === designationName.trim().toLowerCase(),
    );
    if (!desig) {
      throw new BadRequestException(
        `Designation "${designationName}" not found`,
      );
    }
    return desig.id;
  }
}
