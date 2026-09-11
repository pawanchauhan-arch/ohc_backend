import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { parseCsv } from '../../utils/csv-parse.util';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class DriverMasterService {
  constructor(
    @InjectModel(DRIVERMASTER)
    private driverMasterModel: typeof DRIVERMASTER,
  ) { }

  async getDriverByPhoneNumber(phoneNumber: string): Promise<DRIVERMASTER[]> {
    const drivers = await this.driverMasterModel.findAll({
      where: {
        contactNumber: phoneNumber,
        tenant_id: null,
      },
    });
    if (!drivers || drivers.length === 0) {
      throw new NotFoundException(`Patient with phone number ${phoneNumber} not found`);
    }
    return drivers;
  }

  async getDriverByDriverID(driverID: number): Promise<DRIVERMASTER> {
    const driver = await this.driverMasterModel.findOne({
      where: { id: driverID },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${Number} not found`);
    }
    return driver;
  }

  async getEmergencyContacts(phoneNumber: string): Promise<{ emergencyContactName: string; emergencyContactNumber: string }> {
    const driver = await this.driverMasterModel.findOne({ where: { contactNumber: phoneNumber } });
    if (!driver) {
      throw new NotFoundException(`Driver with phone number ${phoneNumber} not found`);
    }
    return {
      emergencyContactName: driver.emergencyContactName,
      emergencyContactNumber: driver.emergencyContactNumber,
    };
  }
  async updateAbhaDetails(driverId: number, abhaNumber: string, abhaDetailsJSON: object): Promise<DRIVERMASTER> {
    // Find the driver by ID
    const driver = await this.driverMasterModel.findByPk(driverId);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverId} not found`);
    }

    // Update the ABHA details
    driver.abhaNumber = abhaNumber;
    driver.abhaDetailsJson = abhaDetailsJSON;

    await driver.save(); // Persist changes
    return driver;
  }
  async registerDriver(driverData: Partial<DRIVERMASTER>): Promise<{ message: string; driver?: DRIVERMASTER }> {
    console.log('driverData Is:', driverData);
    const existingDriver = await this.driverMasterModel.findOne({
      where: { contactNumber: driverData.contactNumber },
    });

    if (existingDriver) {
      return { message: 'Driver already exists.', driver: existingDriver };
    }

    if (driverData.localAddressState) {
      driverData.localAddressState = driverData.localAddressState.toUpperCase();
    }

    const getLastCenterId = await DRIVERMASTER.findOne({
      order: [['id', 'DESC']], // Correctly specify the order by clause
    });



    // Extract the numeric part and increment it
    const nextId = getLastCenterId ? getLastCenterId.id + 1 : 1;
    const uuid = uuidv4().substring(0, 4);

    let external_id = '';
    if (driverData.createdBy) {
      external_id = `LMC0000${nextId}_${uuid}_${driverData.createdBy}`;
    } else {
      external_id = `LMC0000${nextId}_${uuid}`;
    }
    // console.log('Generated External ID:', external_id);

    const newDriver = await this.driverMasterModel.create({
      ...driverData,
      external_id: external_id,
    });

    return { message: 'Driver registered successfully.', driver: newDriver };
  }


  async banDriver(driver_id: number): Promise<boolean> {
    const driver = await this.driverMasterModel.findByPk(driver_id);

    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driver_id} not found.`);
    }

    await this.driverMasterModel.update(
      { isBanned: true },
      { where: { id: driver_id } }
    );

    return true;
  }

  async importDriversCsv(centerIdScope: number, cetId: number, file: Express.Multer.File) {
    if (!file || !file.buffer) throw new BadRequestException('CSV file is required');
    if (!cetId || Number.isNaN(cetId)) throw new BadRequestException('cetId is required');
    const content = file.buffer.toString('utf-8');
    const { headers, rows } = parseCsv(content);
    if (headers.length === 0) throw new BadRequestException('Empty CSV');
    const result = { total: rows.length, created: 0, updated: 0, skipped: 0, errors: [] as any[] };
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const employeeId = (row['employee_id'] || row['employeeId'] || '').trim();
      const clientIdStr = (row['client_id'] || row['clientId'] || '').trim();
      if (!employeeId) { result.skipped++; result.errors.push({ row: i + 2, reason: 'missing_employee_id' }); continue; }
      const clientId = clientIdStr ? String(clientIdStr) : null;
      const name = (row['name'] || '').trim();
      const contactNumber = (row['contactNumber'] || row['phone'] || '').trim();
      const gender = (row['gender'] || '').trim();
      const where: any = { employeeId };
      const existing = await this.driverMasterModel.findOne({ where });
      if (!existing) {
        try {
          await this.driverMasterModel.create({
            employeeId,
            clientId: clientId as any,
            name,
            contactNumber,
            gender,
            createdBy: centerIdScope,
            driver_cetid: cetId,
          } as any);
          result.created++;
        } catch (e) {
          result.skipped++; result.errors.push({ row: i + 2, employee_id: employeeId, reason: 'create_failed' });
        }
      } else {
        try {
          existing.clientId = clientId as any;
          if (name) existing.name = name;
          if (contactNumber) existing.contactNumber = contactNumber;
          if (gender) existing.gender = gender as any;
          existing.driver_cetid = cetId;
          await existing.save();
          result.updated++;
        } catch (e) {
          result.skipped++; result.errors.push({ row: i + 2, employee_id: employeeId, reason: 'update_failed' });
        }
      }
    }
    return result;
  }

  async updateDriver(driverData: Partial<DRIVERMASTER>): Promise<{ message: string; driver?: DRIVERMASTER }> {
    const driver = await this.driverMasterModel.findByPk(driverData.id);
    if (!driver) {
      throw new NotFoundException(`Driver with ID ${driverData.id} not found.`);
    }
    await driver.update(driverData);
    return { message: 'Driver updated successfully.', driver };
  }
}
