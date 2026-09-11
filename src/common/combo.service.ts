import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { buildScopeWhere } from 'src/helper/auth.helper';
import { User } from '../models/User';
import { InjectModel } from '@nestjs/sequelize';
@Injectable()
export class ComboService {
  constructor(
    private readonly sequelize: Sequelize,
    @InjectModel(User)
    private readonly userModel: typeof User,
  ) {}

  // async getDoctors() {
  //   const [results] = await this.sequelize.query(`
  //     SELECT d.id, u.username AS doctor_name
  //     FROM "Doctors" d
  //     JOIN "Users" u ON u.id = d.user_id
  //     WHERE u.role_id = 4
  //     ORDER BY u.username ASC
  //   `);
  //   return results;
  // }
  async getDoctors(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.userModel,
    );

    const [results] = await this.sequelize.query(
      `
   SELECT DISTINCT
    d.id,
    u.username AS doctor_name
FROM "Doctors" d
JOIN "Users" u
    ON u.id = d.user_id
WHERE u.role_id = 4
AND u.status = true
AND u.tenant_id = :tenant_id
AND u.center_id = :center_id
ORDER BY u.username;
    `,
      {
        replacements: {
          tenant_id: scopeWhere.tenant_id,
          center_id: scopeWhere.center_id,
        },
      },
    );

    return results;
  }

  async getDepartments() {
    const [results] = await this.sequelize.query(`
      SELECT id, name
      FROM "department"
      WHERE is_active = true
      ORDER BY name
    `);
    return results;
  }

  async getPayModes() {
    const [results] = await this.sequelize.query(`
      SELECT id, name
      FROM "paymode"
      ORDER BY name
    `);
    return results;
  }

  async getCollectedBy(roleId = 1) {
    const [results] = await this.sequelize.query(
      `
      SELECT id, name
      FROM "Users"
      WHERE role_id = :roleId AND status = true
      ORDER BY name ASC
      `,
      { replacements: { roleId } },
    );
    return results;
  }
  async getAllDiseases() {
    const [results] = await this.sequelize.query(`
        SELECT id, name, code, category, description, is_active
        FROM "diseases"
        WHERE is_active = true
        ORDER BY name ASC
    `);

    return results;
  }

  async getAllMedicineSuppliers() {
    const [results] = await this.sequelize.query(`
      SELECT "SupplierID", "ID", "Supplier" as name
      FROM "cms_picaso_str_supplierdetailsmst"
      WHERE "IsActive" = B'1'
      ORDER BY name ASC
  `);

    return results;
  }

  async getAllMedicineType() {
    const [results] = await this.sequelize.query(`
      SELECT "ID","Descriptions" from "picaso_itemtypes"
      WHERE "IsActive" = B'1'
      ORDER BY "Descriptions" ASC
  `);

    return results;
  }

  async getAllHSNCode() {
    const [results] = await this.sequelize.query(`
     SELECT "HSNID","HSNCode","SGST" ,"CGST","IGST"  from "picasoid_hsndetails"
     WHERE "IsActive" = B'1'
     ORDER BY "HSNCode" asc
  `);

    return results;
  }

  async getAllUser() {
    const [results] = await this.sequelize.query(`
      SELECT id, username FROM "Users" WHERE status = true ORDER BY name ASC
    `);
    return results;
  }

  async getCenterCombo() {
    const [results] = await this.sequelize.query(`
      SELECT "project_name" || '(' || "agency_district" || ')' AS center_name, id 
         FROM "Centers"
         ORDER BY center_name ASC
    `);
    return results;
  }
  // Need to add company id check
  async getB2CAllUser() {
    const [results] = await this.sequelize.query(`
      
      SELECT u.id, username FROM "Users" u
      left join "Roles" r ON r.id = u.role_id 
      where status = true  and r.slug ='b2c'
      ORDER BY name ASC

    `);
    return results;
  }
  async getB2CAllRelation() {
    const [results] = await this.sequelize.query(`
      
      
SELECT "ID", "Code" FROM "CMS_Picaso_Relationship" v
      where v."IsActive" = true
      ORDER BY "Code" ASC

    `);
    return results;
  }
  async getB2CAllOccupation() {
    const [results] = await this.sequelize.query(`
      
      SELECT "OccupationID","Descriptions" FROM "CMS_Picaso_OccupationDetailMST" u
      where u."IsActive" = true
      ORDER BY "Descriptions" ASC

    `);
    return results;
  }
  async getB2CNursing(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.userModel,
    );

    const b2cRoleId = scopeWhere.tenant_id === 1 ? 24 : 25;

    const [results] = await this.sequelize.query(
      `
      SELECT
        u.id,
        u.username
      FROM "Users" u
      WHERE u.b2c_role_id = :b2c_role_id
        AND u.status = true
        AND u.tenant_id = :tenant_id
        AND u.center_id = :center_id
      ORDER BY u.username;
    `,
      {
        replacements: {
          b2c_role_id: b2cRoleId,
          tenant_id: scopeWhere.tenant_id,
          center_id: scopeWhere.center_id,
        },
      },
    );

    return results;
  }
  async getLab(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.userModel,
    );
    const b2cRoleId = scopeWhere.tenant_id === 1 ? 26 : 27;
    const [results] = await this.sequelize.query(
      `
      SELECT
        u.id,
        u.username
      FROM "Users" u
      WHERE u.b2c_role_id = :b2c_role_id
        AND u.status = true
        AND u.tenant_id = :tenant_id
        AND u.center_id = :center_id
      ORDER BY u.username;
    `,
      {
        replacements: {
          b2c_role_id: b2cRoleId,
          tenant_id: scopeWhere.tenant_id,
          center_id: scopeWhere.center_id,
        },
      },
    );

    return results;
  }

  async getRadiology(requestingUser: any) {
    const scopeWhere = buildScopeWhere(
      {
        id: requestingUser.id,
        role: requestingUser.role,
        tenant_id: requestingUser.tenantId,
        center_id: requestingUser.centerId,
      },
      this.userModel,
    );
    const b2cRoleId = scopeWhere.tenant_id === 1 ? 30 : 30;
    const [results] = await this.sequelize.query(
      `
      SELECT
        u.id,
        u.username
      FROM "Users" u
      WHERE u.b2c_role_id = :b2c_role_id
        AND u.status = true
        AND u.tenant_id = :tenant_id
        AND u.center_id = :center_id
      ORDER BY u.username;
    `,
      {
        replacements: {
          b2c_role_id: b2cRoleId,
          tenant_id: scopeWhere.tenant_id,
          center_id: scopeWhere.center_id,
        },
      },
    );

    return results;
  }
}
