import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OHCFitnessCertificate } from '../../models/OHCFitnessCertificate.model';
import { CertificateTemplate } from '../../models/OhcCertificateTemplate.model';
import { OrganizationProfile } from '../../models/OrganizationProfile';
import * as fs from 'fs';
import * as path from 'path';
import * as puppeteer from 'puppeteer';
import { buildFitnessCertificateHtml } from './certificate-html.util';

@Injectable()
export class OhcFitnessService {
  constructor(
    @InjectModel(OHCFitnessCertificate)
    private readonly certModel: typeof OHCFitnessCertificate,

    @InjectModel(CertificateTemplate)
    private readonly templateModel: typeof CertificateTemplate,

    @InjectModel(OrganizationProfile)
    private readonly organizationProfileModel: typeof OrganizationProfile,

    private readonly sequelize: Sequelize,
  ) {}

  private async generateCertificateNumber(transaction: any) {
    const [result]: any = await this.sequelize.query(
      `SELECT nextval('ohc_cert_seq') as seq`,
      { transaction },
    );

    const seq = result[0].seq;
    const year = new Date().getFullYear();

    return `OHC-${year}-${seq.toString().padStart(4, '0')}`;
  }

  private async resolveOrganizationProfile(
    tenantId?: number,
    centerId?: number,
  ) {
    if (!tenantId) return null;

    const where: any = {
      tenant_id: tenantId,
      is_active: true,
    };

    if (centerId) {
      where.center_id = centerId;
    }

    const profile = await this.organizationProfileModel.findOne({
      where,
      order: [['center_id', 'DESC NULLS LAST']],
    });

    if (!profile) return null;

    const json = profile.toJSON() as Record<string, any>;
    if (json.logo) {
      json.logo = this.resolveAssetPath(json.logo);
    }

    return json;
  }

  private async resolveProjectName(tenantId?: number, centerId?: number) {
    const profile = await this.resolveOrganizationProfile(tenantId, centerId);
    return profile?.display_name || null;
  }

  private resolveAssetPath(assetPath?: string) {
    if (!assetPath) return '';
    if (assetPath.startsWith('http://') || assetPath.startsWith('https://')) {
      return assetPath;
    }

    const relativePath = assetPath.replace(/^\//, '');
    const localPath = path.join(process.cwd(), relativePath);

    if (fs.existsSync(localPath)) {
      return `file://${localPath.replace(/\\/g, '/')}`;
    }

    return assetPath;
  }

  private mapPayload(data: any, projectName?: string | null) {
    return {
      patient_id: data.patient_id || null,
      project_name: data.project_name || projectName,
      doctor_id: data.doctor_id ? Number(data.doctor_id) : null,
      doctor_name: data.doctor_name || null,
      center_id: data.center_id || null,
      tenant_id: data.tenant_id || 0,
      workman_name: data.workman_name,
      trade: data.trade,
      identification_mark_1: data.identification_mark_1 || null,
      identification_mark_2: data.identification_mark_2 || null,
      guardian_name: data.guardian_name,
      sex: data.sex,
      residence_address: data.residence_address,
      date_of_birth: data.date_of_birth || null,
      certificate_age: data.certificate_age,
      reason_refusal: data.reason_refusal || null,
      reason_revoked: data.reason_revoked || null,
      height: data.height != null && data.height !== '' ? String(data.height) : null,
      weight: data.weight != null && data.weight !== '' ? String(data.weight) : null,
      blood_pressure:
        data.blood_pressure != null && data.blood_pressure !== ''
          ? String(data.blood_pressure)
          : null,
      pulse: data.pulse != null && data.pulse !== '' ? String(data.pulse) : null,
      hearing: data.hearing || null,
      refractive_error: data.refractive_error || null,
      color_vision: data.color_vision || null,
      any_disability: data.any_disability || null,
      arm_grip: data.arm_grip || null,
      leg_foot_function: data.leg_foot_function || null,
      prev_varicose: data.prev_varicose || null,
      prev_seizure: data.prev_seizure || null,
      prev_vertigo: data.prev_vertigo || null,
      prev_acrophobia: data.prev_acrophobia || null,
      prev_diabetes: data.prev_diabetes || null,
      prev_stroke: data.prev_stroke || null,
      prev_heart_diseases: data.prev_heart_diseases || null,
      prev_major_illness_surgery: data.prev_major_illness_surgery || null,
      prev_symptoms_visible: data.prev_symptoms_visible || null,
      prev_others: data.prev_others || null,
      op_general_physique: data.op_general_physique || null,
      op_vision: data.op_vision || null,
      op_hearing: data.op_hearing || null,
      op_breathing: data.op_breathing || null,
      op_upper_limbs: data.op_upper_limbs || null,
      op_lower_limbs: data.op_lower_limbs || null,
      op_spine: data.op_spine || null,
      op_general_mental_alertness: data.op_general_mental_alertness || null,
      op_other_examination: data.op_other_examination || null,
      fh_skin_diseases: data.fh_skin_diseases || null,
      fh_personal_hygiene: data.fh_personal_hygiene || null,
      fh_chest_xray: data.fh_chest_xray || null,
      welder_respiratory_diseases: data.welder_respiratory_diseases || null,
      welder_chest_xray: data.welder_chest_xray || null,
      created_by: data.created_by,
      updated_by: data.updated_by,
    };
  }

  private validatePayload(data: any) {
    const required = [
      'workman_name',
      'trade',
      'guardian_name',
      'sex',
      'residence_address',
      'certificate_age',
    ];

    const missing = required.filter(
      (field) => !data[field]?.toString()?.trim(),
    );
    if (missing.length) {
      throw new BadRequestException(
        `Missing required fields: ${missing.join(', ')}`,
      );
    }
  }

  private async htmlToPdfBuffer(html: string) {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    return Buffer.from(buffer);
  }

  async createCertificate(data: any) {
    this.validatePayload(data);

    return this.sequelize.transaction(async (t) => {
      const certNo = await this.generateCertificateNumber(t);
      const projectName = await this.resolveProjectName(
        data.tenant_id,
        data.center_id,
      );

      return this.certModel.create(
        {
          ...this.mapPayload(data, projectName),
          certificate_number: certNo,
        },
        { transaction: t },
      );
    });
  }

  async findAll() {
    return this.certModel.findAll({
      where: { is_deleted: false },
      order: [['created_at', 'DESC']],
    });
  }

  async findOne(id: number) {
    const record = await this.certModel.findOne({
      where: { id, is_deleted: false },
    });

    if (!record) {
      throw new NotFoundException('Certificate not found');
    }

    return record;
  }

  async update(id: number, data: any) {
    const record = await this.findOne(id);
    this.validatePayload({ ...record.toJSON(), ...data });

    const projectName = await this.resolveProjectName(
      data.tenant_id ?? record.tenant_id,
      data.center_id ?? record.center_id,
    );
 await record.update(
      this.mapPayload({ ...record.toJSON(), ...data }, projectName),
    );
    return record;
  }

  async softDelete(id: number) {
    const record = await this.findOne(id);
    await record.update({ is_deleted: true });
    return { message: 'Deleted successfully' };
  }

  async previewCertificate(data: any) {
    const orgProfile = await this.resolveOrganizationProfile(
      data.tenant_id,
      data.center_id,
    );
    const projectName = orgProfile?.display_name || data.project_name;

    return buildFitnessCertificateHtml(
      {
        ...this.mapPayload(data, projectName),
        certificate_number: data.certificate_number || 'PREVIEW',
      },
      orgProfile,
    );
  }

  async previewCertificatePdf(data: any) {
    const orgProfile = await this.resolveOrganizationProfile(
      data.tenant_id,
      data.center_id,
    );
    const projectName = orgProfile?.display_name || data.project_name;
    const html = buildFitnessCertificateHtml(
      {
        ...this.mapPayload(data, projectName),
        certificate_number: data.certificate_number || 'PREVIEW',
        created_at: data.created_at || new Date(),
      },
      orgProfile,
    );

    return this.htmlToPdfBuffer(html);
  }

  async downloadCertificatePdf(id: number) {
    const cert = await this.findOne(id);
    const orgProfile = await this.resolveOrganizationProfile(
      cert.tenant_id,
      cert.center_id,
    );
    const html = buildFitnessCertificateHtml(cert.toJSON(), orgProfile);
    const buffer = await this.htmlToPdfBuffer(html);

    return {
      buffer,
      fileName: `Fitness-Certificate-${cert.certificate_number || id}.pdf`,
    };
  }

  createTemplate(data: any) {
    data.is_deleted = false;
    return this.templateModel.create(data);
  }

  async findTemplates(tenant_id?: number) {
    const where: any = { is_deleted: false };
    if (tenant_id) where.tenant_id = tenant_id;

    return this.templateModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
  }

  async previewTemplate(body: any) {
    const { template_id, data: values } = body;
    const template = await this.templateModel.findByPk(template_id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.previewCertificate(values);
  }

  async updateTemplate(id: number, data: any) {
    const template = await this.templateModel.findOne({
      where: { id, is_deleted: false },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    await template.update(data);
    return template;
  }

  async fitnessCertificateCount(requestingUser: any) {
    const [results] = await this.sequelize.query(
      `
      SELECT *
      FROM "ohc_fitness_certificates"
      WHERE is_deleted = false
        AND tenant_id = :tenantId
        AND center_id = :centerId
      ORDER BY id DESC
    `,
      {
        replacements: {
          tenantId: requestingUser.tenantId,
          centerId: requestingUser.centerId,
        },
      },
    );

    return results;
  }
}
