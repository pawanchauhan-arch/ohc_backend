import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { OHCFitnessCertificate } from '../../models/OHCFitnessCertificate.model';
import { OHCDoctorAssessment } from '../../models/OHCDoctorAssessment.model';
import PDFDocument from 'pdfkit';
import { CertificateTemplate } from '../../models/OhcCertificateTemplate.model';
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import * as puppeteer from 'puppeteer';
import { create } from 'node_modules/axios/index.cjs';
@Injectable()
export class OhcFitnessService {
  constructor(
    @InjectModel(OHCFitnessCertificate)
    private readonly certModel: typeof OHCFitnessCertificate,

    @InjectModel(OHCDoctorAssessment)
    private readonly assessmentModel: typeof OHCDoctorAssessment,

    @InjectModel(CertificateTemplate)
    private readonly templateModel: typeof CertificateTemplate,

    private readonly sequelize: Sequelize,
  ) {}

  // ✅ Generate certificate number (safe using sequence)
  private async generateCertificateNumber(transaction: any) {
    const [result]: any = await this.sequelize.query(
      `SELECT nextval('ohc_cert_seq') as seq`,
      { transaction },
    );

    const seq = result[0].seq;
    const year = new Date().getFullYear();

    return `OHC-${year}-${seq.toString().padStart(4, '0')}`;
  }

  async createCertificate(data: any) {
    return this.sequelize.transaction(async (t) => {
      // ✅ STEP 1: Generate certificate number
      const certNo = await this.generateCertificateNumber(t);
      const assessment = await this.assessmentModel.findOne({
        where: { patient_id: data.patient_id },
        order: [['created_at', 'DESC']],
        transaction: t,
      });

      if (!assessment) {
        throw new BadRequestException('No assessment found for this patient');
      }
      const values = {
        patient_id: data.patient_id,
        assessment_id: assessment.id,
        certificate_number: certNo,
        issue_date: data.issue_date,
        valid_till: data.valid_till,
        fitness_status: data.fitness_status,
        restrictions: data.restrictions,
        recommendations: data.recommendations,
        doctor_signature: data.doctor_signature,
        organization_seal: data.organization_seal,
        pdf_url: data.pdf_url,
        name: data.name,
        gender: data.gender,
        age: data.age,
        employee_id: data.employee_id,
        template_id: data.template_id,
        tenant_id: data.tenant_id,
        created_by: data.created_by,
      };

      const cert = await this.certModel.create(
        {
          ...values,
        },
        { transaction: t },
      );

      // 🔹 Get template
      const template = await this.templateModel.findOne({
        where: {
          id: cert.template_id,
          // tenant_id: cert.tenant_id,
        },
      });

      if (!template) {
        throw new NotFoundException('Template not found');
      }

      // ✅ STEP 3: Pass FULL data (including cert number)
      const compiled = Handlebars.compile(template.template_html);

      const html = compiled({
        ...cert.toJSON(),
        cert_no: cert.certificate_number, // 👈 IMPORTANT
      });

      // 🔹 File path
      const dir = path.join(process.cwd(), 'uploads/certificates');

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // const filePath = `${dir}/cert_${cert.id}.pdf`;
      const fileName = `cert_${cert.id}.pdf`;
      const filePath = path.join(dir, fileName);

      // 🔹 Generate PDF
      const browser = await puppeteer.launch({
        args: ['--no-sandbox'],
      });

      const page = await browser.newPage();
      await page.setContent(html);

      await page.pdf({
        path: filePath,
        format: 'A4',
      });

      await browser.close();

      // ✅ STEP 4: Save PDF path
      await cert.update(
        {
          pdf_url: `/uploads/certificates/${fileName}`,
        },
        { transaction: t },
      );
      console.log('Saving file to:', filePath);
      console.log('process.cwd():', process.cwd());
      return cert;
    });
  }

  // ✅ Get all certificates
  async findAll() {
    return this.certModel.findAll();
  }

  // ✅ Get by patient
  async findByPatient(patient_id: number) {
    return this.certModel.findAll({
      where: { patient_id },
    });
  }

  // ✅ Update certificate
  async update(id: number, data: any) {
    const record = await this.certModel.findOne({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Certificate not found');
    }

    await record.update(data);
    return record;
  }

  // ✅ Soft delete
  async softDelete(id: number) {
    const record = await this.certModel.findOne({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Certificate not found');
    }

    await record.update({ is_deleted: true });

    return { message: 'Deleted successfully' };
  }
  createTemplate(data: any) {
    data.is_deleted = false;
    return this.templateModel.create(data);
  }

  async findTemplates(tenant_id?: number) {
    const where: any = {
      is_deleted: false,
    };

    if (tenant_id) {
      where.tenant_id = tenant_id;
    }

    const data = await this.templateModel.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    return data;
  }
  async previewTemplate(body: any) {
    const { template_id, data: values } = body;

    const template = await this.templateModel.findByPk(template_id);
    // below is standard data mapping for preview, you can customize as needed
    let data = {
      age: values.Age || 'N/A',
      employee_id: values.EmployeeId || 'N/A',
      gender: values.Gender || 'N/A',
      name: values.Name || 'N/A',
      certificate_number: 'PREVIEW',
      doctor_signature: values.doctor_signature || 'N/A',
      fitness_status: values.fitness_status || 'N/A',
      issue_date: values.issue_date || 'N/A',
      patient_id: values.patient_id || 'N/A',
      recommendations: values.recommendations || 'N/A',
      restrictions: values.restrictions || 'N/A',
      template_id: values.template_id || 'N/A',
      valid_till: values.valid_till || 'N/A',
      assessment_id: values?.assessment_id || 'N/A',
      authorized_name: values?.authorized_name || 'N/A',
    };
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    const compiled = Handlebars.compile(template.template_html);
    return compiled(data);
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
}
