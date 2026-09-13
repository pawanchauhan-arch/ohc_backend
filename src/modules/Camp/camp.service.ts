import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { CampList } from '../../models/CampList';
import { CampListItem } from '../../models/CampListItem';
import { CampItemBarcode } from '../../models/CampItemBarcode';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { Center } from '../../models/Center';
import { CETMANAGEMENT } from '../../models/CetManagement';
import { CenterUser } from '../../models/CenterUser';
import { User } from '../../models/User';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { AddCampItemDto, UpdateCampItemDto, CreateBarcodeDto } from './camp.dto';
import { parseCsv } from '../../utils/csv-parse.util';
import { CreateCustomerCampDto, UpdateCustomerCampDto } from '../Samplify/samplify.dto';
import { DriverMasterService } from '../DriverMaster/DriverMaster.service';

@Injectable()
export class CampService {
  constructor(
    @InjectModel(CampList) private readonly campListModel: typeof CampList,
    @InjectModel(CampListItem) private readonly campListItemModel: typeof CampListItem,
    @InjectModel(DRIVERMASTER) private readonly driverModel: typeof DRIVERMASTER,
    @InjectModel(Center) private readonly centerModel: typeof Center,
    @InjectModel(CETMANAGEMENT) private readonly cetModel: typeof CETMANAGEMENT,
    @InjectModel(CenterUser) private readonly centerUserModel: typeof CenterUser,
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(driverhealthcheckup) private readonly dhcModel: typeof driverhealthcheckup,
    @InjectModel(CampItemBarcode) private readonly barcodeModel: typeof CampItemBarcode,
    private readonly driverMasterService: DriverMasterService,
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

  async createCamp(data: CreateCustomerCampDto, centerIdScope: number): Promise<CampList> {
    if (!data.cet_id) {
      throw new BadRequestException('cet_id is required');
    }

    // Validate that CET exists (no center ownership enforced)
    const cet = await this.cetModel.findByPk(data.cet_id);
    if (!cet) {
      throw new BadRequestException('CET not found');
    }

    const camp = await this.campListModel.create({
      center_id: centerIdScope,
      cet_id: data.cet_id,
      scheduled_on: data.date,
      location_text: data.address ?? null,
      camp_spoc_name: data.camp_spoc_name,
      camp_spoc_phone: data.camp_spoc_phone,
      camp_spoc_email: data.camp_spoc_email,
      pincode: data.pincode,
      corporate_name: data.corporate_name ?? null,
      invoice_url: data.invoice_url?.trim() || null,
      po_url: data.po_url?.trim() || null,
      remark: data.remark ?? null,
      is_completed: false,
    });
    if(data.camp_ref_id){
      camp.camp_ref_id = data.camp_ref_id;
    }
    else{
      camp.camp_ref_id = "LMC-"+ centerIdScope + "-" + camp.id;
    }
    camp.statusSamplify="CAMP_CREATED"
    await camp.save();
    data.camp_ref_id = camp.camp_ref_id;

    return camp;
  }

  async listCamps(centerIdScope: number): Promise<CampList[]> {
    return this.campListModel.findAll({
      where: { center_id: centerIdScope },
      include: [{ model: CETMANAGEMENT, as: 'cet' }],
      order: [['scheduled_on', 'DESC']],
    });
  }

  async getCamp(campId: number, centerIdScope: number): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId, { 
      include: [
        { model: CETMANAGEMENT, as: 'cet' },
        { 
          model: CampListItem, 
          as: 'items',
          include: [
            {
              model: DRIVERMASTER,
              as: 'driver',
            },
            {
              model: driverhealthcheckup,
              as: 'driverHealthCheckup',
              attributes: ['id', 'concerns']
            }
          ]
        }
      ]
    });
    if (!camp || camp.center_id !== centerIdScope) throw new NotFoundException('Camp not found');
    
    // Load assigned phlebotomists if any
    const phlebotomistIds = this.parsePhlebotomistIds(camp.assigned_phlebotomist_ids);

    if (phlebotomistIds.length > 0) {
      const phlebotomists = await this.centerUserModel.findAll({
        where: {
          id: {
            [Op.in]: phlebotomistIds
          },
          center_id: centerIdScope,
          user_type: 'PHLEBO'
        },
        include: [{ model: User, as: 'user' }]
      });
      camp.assignedPhlebotomists = phlebotomists;
    } 
    
    return camp;
  }

  async updateCamp(campId: number, centerIdScope: number, data: UpdateCustomerCampDto): Promise<CampList> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) throw new NotFoundException('Camp not found');
    
    // Validate and update CET if provided (no center ownership enforced)
    if (data.cet_id) {
      const cet = await this.cetModel.findByPk(data.cet_id);
      if (!cet) {
        throw new BadRequestException('CET not found');
      }
      camp.cet_id = data.cet_id;
    }
    
    camp.scheduled_on = data.date ?? camp.scheduled_on;
    camp.location_text = data.address ?? camp.location_text;
    camp.pincode = data.pincode ?? camp.pincode;
    camp.corporate_name = data.corporate_name ?? camp.corporate_name;
    
    // Handle invoice_url and po_url: allow null values to clear the field
    if (data.invoice_url !== undefined) {
      camp.invoice_url = data.invoice_url === null ? null : data.invoice_url.trim();
    }
    if (data.po_url !== undefined) {
      camp.po_url = data.po_url === null ? null : data.po_url.trim();
    }
    
    camp.remark = data.remark ?? camp.remark;
    camp.camp_spoc_name = data.camp_spoc_name ?? camp.camp_spoc_name;
    camp.camp_spoc_phone = data.camp_spoc_phone ?? camp.camp_spoc_phone;
    camp.camp_spoc_email = data.camp_spoc_email ?? camp.camp_spoc_email;
    camp.camp_ref_id = data.camp_ref_id ?? camp.camp_ref_id;

    if (typeof data.isCompleted === 'boolean') {
      camp.is_completed = data.isCompleted;
      if (data.isCompleted) {
        camp.statusSamplify = 'CAMP_COMPLETED';
      }
    }

    await camp.save();
    return camp;
  }

  async addItem(campId: number, centerIdScope: number, data: AddCampItemDto): Promise<CampListItem> {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) throw new NotFoundException('Camp not found');
    const driver = await this.driverModel.findByPk(data.driverId);
    if (!driver || driver.createdBy !== centerIdScope) throw new BadRequestException('Invalid driver_id');
    const existing = await this.campListItemModel.findOne({ where: { camp_id: campId, driver_id: data.driverId } });
    if (existing) throw new BadRequestException('Driver already in camp');
    const item = await this.campListItemModel.create({
      camp_id: campId,
      driver_id: data.driverId,
      is_completed: false,
      remarks: data.remarks ?? null,
      driver_health_checkup_id: null,
    });
    return item;
  }

  async updateItem(itemId: number, centerIdScope: number, data: UpdateCampItemDto): Promise<CampListItem> {
    const item = await this.campListItemModel.findByPk(itemId, { include: [{ model: CampList, as: 'camp' }] });
    if (!item || !item.camp || item.camp.center_id !== centerIdScope) throw new NotFoundException('Item not found');
    if (data.driverHealthCheckupId !== undefined && data.driverHealthCheckupId !== null) {
      const dhc = await this.dhcModel.findByPk(data.driverHealthCheckupId);
      if (!dhc) throw new BadRequestException('Invalid driver_health_checkup_id');
    }
    if (typeof data.isCompleted === 'boolean') item.is_completed = data.isCompleted;
    item.driver_health_checkup_id = data.driverHealthCheckupId ?? item.driver_health_checkup_id;
    item.id_proof_image = data.idProofImage ?? item.id_proof_image;
    await item.save();
    return item;
  }

  async removeItem(itemId: number, centerIdScope: number): Promise<void> {
    const item = await this.campListItemModel.findByPk(itemId, { include: [{ model: CampList, as: 'camp' }] });
    if (!item || !item.camp || item.camp.center_id !== centerIdScope) throw new NotFoundException('Item not found');
    if (item.driver_health_checkup_id) throw new BadRequestException('Cannot remove item with health record');
    await item.destroy();
  }

  async importCampItemsCsv(campId: number, centerIdScope: number, file: Express.Multer.File) {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) throw new NotFoundException('Camp not found');
    if (!file || !file.buffer) throw new BadRequestException('CSV file is required');
    const content = file.buffer.toString('utf-8');
    const { headers, rows } = parseCsv(content);
    if (headers.length === 0) throw new BadRequestException('Empty CSV');
    const result = { total: rows.length, inserted: 0, skipped: 0, failed: 0, duplicates: 0, errors: [] as any[] };
    const buildError = (row: number, employeeId: string | undefined, reason: string) => ({
      row,
      ...(employeeId ? { employee_id: employeeId } : {}),
      reason,
      message: reason === 'already_in_camp'
        ? 'This employee is already added to the camp.'
        : reason === 'driver_not_found'
          ? 'Employee ID was not found.'
          : reason === 'cross_center'
            ? 'This employee belongs to a different center.'
            : reason === 'missing_employee_id'
              ? 'Employee ID is missing.'
              : reason.replace(/_/g, ' '),
    });
    const employeeIds = rows.map(r => (r['employee_id'] || r['employeeId'] || '').trim()).filter(v => v.length > 0);
    if (employeeIds.length === 0) return result;
    const drivers = await this.driverModel.findAll({ where: { employeeId: employeeIds } as any });
    const employeeToDriver: Record<string, DRIVERMASTER> = {};
    for (const d of drivers) {
      if (d.employeeId) employeeToDriver[d.employeeId] = d;
    }
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const emp = (row['employee_id'] || row['employeeId'] || '').trim();
      if (!emp) { result.skipped++; result.failed++; result.errors.push(buildError(i + 2, undefined, 'missing_employee_id')); continue; }
      const driver = employeeToDriver[emp];
      if (!driver) { result.skipped++; result.failed++; result.errors.push(buildError(i + 2, emp, 'driver_not_found')); continue; }
      if (driver.createdBy !== centerIdScope) { result.skipped++; result.failed++; result.errors.push(buildError(i + 2, emp, 'cross_center')); continue; }
      const exists = await this.campListItemModel.findOne({ where: { camp_id: campId, driver_id: driver.id } });
      if (exists) { result.skipped++; result.failed++; result.duplicates++; result.errors.push(buildError(i + 2, emp, 'already_in_camp')); continue; }
      await this.campListItemModel.create({ camp_id: campId, driver_id: driver.id, is_completed: false, remarks: null, driver_health_checkup_id: null });
      result.inserted++;
    }
    return result;
  }
  async createBarcode(itemId: number, centerIdScope: number, dto: CreateBarcodeDto): Promise<CampItemBarcode> {
    const item = await this.campListItemModel.findByPk(itemId, { include: [{ model: CampList, as: 'camp' }] });
    if (!item || !item.camp || item.camp.center_id !== centerIdScope) throw new NotFoundException('Item not found');
    if (!dto.code || dto.code.trim().length === 0) throw new BadRequestException('code is required');
    return this.barcodeModel.create({
      camp_list_item_id: item.id,
      code: dto.code,
      comment: dto.comment ?? null,
      image_url: dto.imageUrl ?? null,
      test_name: dto.test_name ?? null,
    });
  }

  async listBarcodes(itemId: number, centerIdScope: number): Promise<CampItemBarcode[]> {
    const item = await this.campListItemModel.findByPk(itemId, { include: [{ model: CampList, as: 'camp' }] });
    if (!item || !item.camp || item.camp.center_id !== centerIdScope) throw new NotFoundException('Item not found');
    return this.barcodeModel.findAll({ where: { camp_list_item_id: itemId }, order: [['createdAt', 'DESC']] });
  }

  async deleteBarcode(itemId: number, barcodeId: number, centerIdScope: number): Promise<void> {
    const item = await this.campListItemModel.findByPk(itemId, { include: [{ model: CampList, as: 'camp' }] });
    if (!item || !item.camp || item.camp.center_id !== centerIdScope) throw new NotFoundException('Item not found');
    const barcode = await this.barcodeModel.findByPk(barcodeId);
    if (!barcode || barcode.camp_list_item_id !== item.id) throw new NotFoundException('Barcode not found');
    await barcode.destroy();
  }

  // private async importDriversCsv(centerIdScope: number, file: Express.Multer.File, campId: number) {
  //   campId
  //   if (!file || !file.buffer) throw new BadRequestException('CSV file is required');
  //   const content = file.buffer.toString('utf-8');
  //   const { headers, rows } = parseCsv(content);
  //   if (headers.length === 0) throw new BadRequestException('Empty CSV');
  //   const result = { total: rows.length, created: 0, updated: 0, skipped: 0, errors: [] as any[] };
  //   const patients=[];
  //   for (let i = 0; i < rows.length; i++) {
  //     const row = rows[i];
  //     const employeeId = (row['employee_id'] || row['employeeId'] || '').trim();
  //     const clientIdStr = (row['client_id'] || row['clientId'] || '').trim();
  //     if (!employeeId) { result.skipped++; result.errors.push({ row: i + 2, reason: 'missing_employee_id' }); continue; }
  //     const clientId = clientIdStr ? Number(clientIdStr) : null;
  //     const name = (row['name'] || '').trim();
  //     const first_name = name.split(' ')[0] || '';
  //     const last_name = name.split(' ')[1] || '';
  //     const contactNumber = (row['contactNumber'] || row['phone'] || '').trim();
  //     const gender = (row['gender'] || '').trim();
  //     const age = (row['age'] || '').trim();
  //     const where: any = { employeeId };
  //     const existing = await this.driverModel.findOne({ where });
  //     if (!existing) {
  //       try {
  //         const existing = await this.driverModel.create({
  //           employeeId,
  //           clientId: clientId as any,
  //           name,
  //           contactNumber,
  //           gender,
  //           createdBy: centerIdScope,
  //           // Cet Id also 
  //         } as any);
  //         await this.campListItemModel.create({
  //           camp_id: campId,
  //           driver_id: existing.id,
  //           is_completed: false,
  //           remarks: null,
  //           driver_health_checkup_id: null,
  //         });
  //         result.created++;
  //         patients.push({patient_ref_id:employeeId,first_name:first_name,last_name:last_name,gender:gender,age:age});
  //       } catch (e) {
  //         result.skipped++; result.errors.push({ row: i + 2, employee_id: employeeId, reason: 'create_failed' });
  //       }
  //     } else {
  //       try {
  //         existing.clientId = clientId as any;
  //         if (name) existing.name = name;
  //         if (contactNumber) existing.contactNumber = contactNumber;
  //         if (gender) existing.gender = gender as any;
  //         await existing.save();
  //         result.updated++;
  //         patients.push({patient_ref_id:employeeId,first_name:first_name,last_name:last_name,gender:gender,age:age});
  //       } catch (e) {
  //         result.skipped++; result.errors.push({ row: i + 2, employee_id: employeeId, reason: 'update_failed' });
  //       }
  //     }
  //   }
  //   return patients;
  // }

  async uploadPatientsCsv( file: Express.Multer.File) {

    if (!file || !file.buffer) throw new BadRequestException('CSV file is required');
    const content = file.buffer.toString('utf-8');

    const { headers, rows } = parseCsv(content);
    // console.log("headers --> ", rows)
    if (headers.length === 0) throw new BadRequestException('Empty CSV');
    const readCell = (row: Record<string, any>, ...keys: string[]) => {
      for (const key of keys) {
        const value = row?.[key];
        if (value === undefined || value === null) {
          continue;
        }
        const text = String(value).trim();
        if (text.length > 0) {
          return text;
        }
      }
      return '';
    };

    const getToday = () => new Date().toLocaleDateString('en-CA');
    const parseDate = (dateStr: string): string => {
      if (!dateStr?.trim()) return getToday();
    
      const cleaned = dateStr;
      const date = new Date(cleaned);

      // If invalid date → fallback to today
      if (isNaN(date.getTime())) return getToday();
    
      return date.toLocaleDateString('en-CA');
    };
    
    const normalizeGender = (gender: string): 'Male' | 'Female' | 'Other' | null => {
      if (!gender) return null;
      
      const lowerGender = gender.toLowerCase().trim();
      if (['m', 'male', 'mâle'].includes(lowerGender)) return 'Male';
      if (['f', 'female', 'femme'].includes(lowerGender)) return 'Female';
      if (['o', 'other', 'autre', 'non-binary'].includes(lowerGender)) return 'Other';
      
      return null; // or 'Other' if you want a default
    };
    const driverList=[];
    const result = { total: rows.length, created: 0, updated: 0, skipped: 0, failed: 0, duplicates: 0, errors: [] as any[] };

    const buildError = (row: number, employeeId: string | undefined, reason: string, message?: string, contactNumber?: string) => ({
      row,
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...(contactNumber ? { contact_number: contactNumber } : {}),
      reason,
      message: message ?? (
        reason === 'missing_center_id'
          ? 'Center ID is missing.'
          : reason === 'invalid_center_id'
            ? 'Center ID is invalid.'
            : reason === 'center_not_found'
              ? 'Center was not found.'
              : reason === 'missing_employee_id'
                ? 'Employee ID is missing.'
                : reason === 'register_failed'
                  ? 'Employee registration failed.'
                  : reason === 'camp_create_failed'
                    ? 'Camp could not be created.'
                    : reason === 'camp_item_create_failed'
                      ? 'Camp item could not be created.'
                      : reason === 'invalid_age'
                        ? 'Age is invalid.'
                        : reason.replace(/_/g, ' ')
      ),
    });

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        const centerIdText = readCell(row, 'center_id', 'centerId');
        if (!centerIdText) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'missing_center_id'));
          continue;
        }

        const centerId = Number(centerIdText);
        if (!Number.isFinite(centerId) || centerId <= 0) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'invalid_center_id'));
          continue;
        }

        const campId = readCell(row, 'camp_id', 'campId');
        if (!campId) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'missing_camp_id', 'Camp ID is missing.'));
          continue;
        }

        const camp_spoc_name  = readCell(row, 'camp_spoc_name') || "Amit Yadav";
        const camp_spoc_phone = readCell(row, 'camp_spoc_phone') || "9876543210";
        const camp_spoc_email = readCell(row, 'camp_spoc_email') || "abinav@lmc.in";
        const corporate_name = readCell(row, 'corporate_name') || "LMC";
        const pincode = readCell(row, 'pincode') || "110001";
        const address = readCell(row, 'address') || "New Delhi";
        const scheduled_on = parseDate(readCell(row, 'scheduled_on'));

        const center = await this.centerModel.findByPk(centerId);
        if (!center) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'center_not_found'));
          continue;
        }

        let camp = await this.campListModel.findOne({where:{camp_ref_id:campId}});
        if (!camp || camp.center_id !== centerId) {
          try {
            camp = await this.campListModel.create({camp_spoc_name:camp_spoc_name,camp_spoc_phone:camp_spoc_phone,camp_spoc_email:camp_spoc_email,corporate_name:corporate_name,pincode:pincode,location_text:address,scheduled_on:scheduled_on,center_id:centerId});
            camp.camp_ref_id=campId;
            camp.statusSamplify="CAMP_CREATED";
            await camp.save();
          } catch (error: any) {
            result.skipped++;
            result.errors.push(buildError(index + 2, undefined, 'camp_create_failed', error?.message));
            continue;
          }
        };

        const employeeId = readCell(row, 'employee_id', 'employeeId');
        if (!employeeId) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'missing_employee_id'));
          continue;
        }

        const clientId=String(readCell(row, 'clientId', 'client_id') || null);
        
        const name=readCell(row, 'name');
        const contactNumber=readCell(row, 'contactNumber', 'contact_number');
        const gender=normalizeGender(readCell(row, 'gender')) || "Other";
        const ageText=readCell(row, 'age');
        const age=ageText ? Number(ageText) : undefined;
        if (ageText && Number.isNaN(age)) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'invalid_age'));
          continue;
        }

        let driver=await this.driverModel.findOne({where:{employeeId:employeeId}});
        if (!driver) {
          try {
            const res=await this.driverMasterService.registerDriver({employeeId:employeeId,name:name,contactNumber:contactNumber,gender:gender,age:age,createdBy:centerId,clientId:clientId});
            driver=res.driver;
            result.created++;
          } catch (error: any) {
            result.skipped++;
            result.errors.push(buildError(index + 2, employeeId, 'register_failed', error?.message));
            continue;
          }
        } else {
          result.updated++;
        }

        if (!driver?.id) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'register_failed', 'Unable to resolve employee record.'));
          continue;
        }

        driverList.push({employeeId:employeeId,name:name,contactNumber:contactNumber,gender:gender,age:age});
        let campListItem=await this.campListItemModel.findOne({where:{camp_id:camp.id,driver_id:driver.id}});
        if (!campListItem) {
          try {
            campListItem = await this.campListItemModel.create({camp_id:camp.id,driver_id:driver.id,is_completed:false,remarks:null,driver_health_checkup_id:null});
          } catch (error: any) {
            result.skipped++;
            result.errors.push(buildError(index + 2, employeeId, 'camp_item_create_failed', error?.message));
            continue;
          }
        }; 
        // console.log("campListItem --> ",campListItem)
      } catch (error: any) {
        result.skipped++;
        result.failed++;
        result.errors.push(buildError(index + 2, undefined, 'row_processing_failed', error?.message));
      }
    }

    return {
      success: result.errors.length === 0,
      message: result.errors.length === 0
        ? 'Patients Registered Successfully'
        : 'Patients registered with some issues',
      total: result.total,
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      errors: result.errors,
      data: driverList,
    }
  }

  async uploadCampPatientsBatch(campId: number, centerIdScope: number, patients: any[]) {
    const camp = await this.campListModel.findByPk(campId);
    if (!camp || camp.center_id !== centerIdScope) {
      throw new NotFoundException('Camp not found');
    }

    if (!Array.isArray(patients) || patients.length === 0) {
      throw new BadRequestException('patients array is required');
    }

    const readValue = (row: Record<string, any>, ...keys: string[]) => {
      for (const key of keys) {
        const value = row?.[key];
        if (value === undefined || value === null) {
          continue;
        }

        const text = String(value).trim();
        if (text.length > 0) {
          return text;
        }
      }

      return '';
    };

    const normalizeGender = (gender: string): 'Male' | 'Female' | 'Other' | null => {
      if (!gender) return null;
      const lowerGender = gender.toLowerCase().trim();
      if (['m', 'male'].includes(lowerGender)) return 'Male';
      if (['f', 'female'].includes(lowerGender)) return 'Female';
      if (['o', 'other', 'non-binary'].includes(lowerGender)) return 'Other';
      return null;
    };

    const buildError = (row: number, employeeId: string | undefined, reason: string, message?: string, contactNumber?: string) => ({
      row,
      ...(employeeId ? { employee_id: employeeId } : {}),
      ...(contactNumber ? { contact_number: contactNumber } : {}),
      reason,
      message: message ?? (
        reason === 'missing_center_id'
          ? 'Center ID is missing.'
          : reason === 'invalid_center_id'
            ? 'Center ID is invalid.'
            : reason === 'missing_camp_id'
              ? 'Camp ID is missing.'
              : reason === 'camp_not_found'
                ? 'Camp was not found.'
          : reason === 'missing_employee_id'
                  ? 'Employee ID is missing.'
                  : reason === 'employee_id_exists'
                    ? 'This employee ID already exists.'
                  : reason === 'contact_number_exists'
                    ? 'This contact number already exists.'
                  : reason === 'missing_client_id'
                    ? 'Client ID is missing.'
                    : reason === 'missing_name'
                      ? 'Name is missing.'
                      : reason === 'missing_contact_number'
                        ? 'Contact number is missing.'
                        : reason === 'missing_gender'
                          ? 'Gender is missing.'
                          : reason === 'invalid_gender'
                            ? 'Gender value is invalid.'
                            : reason === 'missing_age'
                              ? 'Age is missing.'
                              : reason === 'invalid_age'
                                ? 'Age is invalid.'
                                : reason === 'already_in_camp'
                                  ? 'This employee is already added to the camp.'
                                  : reason === 'cross_center'
                                    ? 'This employee belongs to a different center.'
                                    : reason === 'driver_not_found'
                                      ? 'Employee ID was not found.'
                                      : reason === 'register_failed'
                                        ? 'Employee registration failed.'
                                        : reason === 'update_failed'
                                          ? 'Employee update failed.'
                                          : reason === 'camp_item_create_failed'
                                            ? 'Camp item could not be created.'
                                            : reason.replace(/_/g, ' ')
      ),
    });

    const result = {
      total: patients.length,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      duplicates: 0,
      errors: [] as any[],
      data: [] as any[],
    };

    for (let index = 0; index < patients.length; index++) {
      const row = patients[index] || {};
      let contactNumber = '';
      try {
        const rowCenterIdText = readValue(row, 'center_id', 'centerId');
        const rowCenterId = Number(rowCenterIdText || centerIdScope);
        if (!Number.isFinite(rowCenterId) || rowCenterId <= 0) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'invalid_center_id'));
          continue;
        }

        const rowCampIdText = readValue(row, 'camp_id', 'campId');
        const rowCampId = Number(rowCampIdText || campId);
        if (!Number.isFinite(rowCampId) || rowCampId <= 0) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'missing_camp_id'));
          continue;
        }

        if (rowCenterId !== centerIdScope) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'cross_center'));
          continue;
        }

        if (rowCampId !== campId) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, undefined, 'camp_not_found'));
          continue;
        }

        const employeeId = readValue(row, 'employee_id', 'employeeId');
        const clientId = readValue(row, 'client_id', 'clientId');
        const name = readValue(row, 'name');
        contactNumber = readValue(row, 'contact_number', 'contactNumber');
        const genderText = readValue(row, 'gender');
        const ageText = readValue(row, 'age');

        if (!employeeId) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, undefined, 'missing_employee_id')); continue; }
        if (!clientId) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, employeeId, 'missing_client_id')); continue; }
        if (!name) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, employeeId, 'missing_name')); continue; }
        if (!contactNumber) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, employeeId, 'missing_contact_number')); continue; }
        if (!genderText) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, employeeId, 'missing_gender')); continue; }
        const gender = normalizeGender(genderText);
        if (!gender) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, employeeId, 'invalid_gender')); continue; }
        if (!ageText) { result.skipped++; result.failed++; result.errors.push(buildError(index + 2, employeeId, 'missing_age')); continue; }

        const age = Number(ageText);
        if (!Number.isFinite(age)) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'invalid_age'));
          continue;
        }

        const existingDriverByEmployee = await this.driverModel.findOne({ where: { employeeId } });
        const existingDriverByContact = await this.driverModel.findOne({ where: { contactNumber } });
        if (existingDriverByEmployee) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'employee_id_exists'));
          continue;
        }

        if (existingDriverByContact) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'contact_number_exists', undefined, contactNumber));
          continue;
        }

        let driver;
        try {
          const registered = await this.driverMasterService.registerDriver({
            employeeId,
            clientId,
            name,
            contactNumber,
            gender,
            age,
            createdBy: rowCenterId,
          });
          driver = registered.driver;
          result.created++;
        } catch (error: any) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'register_failed', error?.message, contactNumber));
          continue;
        }

        if (!driver?.id) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'register_failed', 'Unable to resolve driver record.', contactNumber));
          continue;
        }

        const existingCampLink = await this.campListItemModel.findOne({ where: { camp_id: campId, driver_id: driver.id } });
        if (existingCampLink) {
          result.skipped++;
          result.failed++;
          result.duplicates++;
          result.errors.push(buildError(index + 2, employeeId, 'already_in_camp', undefined, contactNumber));
          continue;
        }

        try {
          await this.campListItemModel.create({
            camp_id: campId,
            driver_id: driver.id,
            is_completed: false,
            remarks: null,
            driver_health_checkup_id: null,
          });

          result.data.push({
            employee_id: employeeId,
            client_id: clientId,
            name,
            contact_number: contactNumber,
            gender,
            age,
          });
        } catch (error: any) {
          result.skipped++;
          result.failed++;
          result.errors.push(buildError(index + 2, employeeId, 'camp_item_create_failed', error?.message, contactNumber));
        }
      } catch (error: any) {
        result.skipped++;
        result.failed++;
        result.errors.push(buildError(index + 2, undefined, 'row_processing_failed', error?.message, contactNumber));
      }
    }

    return {
      success: result.errors.length === 0,
      message: result.errors.length === 0
        ? 'Patients uploaded successfully.'
        : 'Patients uploaded with some issues.',
      ...result,
    };
  }
}
