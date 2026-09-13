// services/samplify.service.ts
import { Injectable, HttpException, HttpStatus, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { Op } from 'sequelize';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CreateCustomerCampDto, CampPatientDto } from './samplify.dto';
import { CampItemBarcode } from '../../models/CampItemBarcode';
import { InjectModel } from '@nestjs/sequelize';
import { CampListItem } from '../../models/CampListItem';
import { CampList } from '../../models/CampList';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { KinesisStreamService } from './kinesis/kinesis.service';
import { kinesisConfig, samplifyConfig } from 'config/envConfig';

const streamName: string = kinesisConfig.streamName;

interface phelboDTO {
  name: string,
  phone: string,
}

@Injectable()
export class SamplifyService {
  private readonly logger = new Logger(SamplifyService.name);
  private readonly baseUrl = 'https://apis.sathi.gosamplify.com';
  private readonly apiKey = samplifyConfig.apiKey;
  private readonly customerCode = samplifyConfig.customerCode;

  constructor(private readonly httpService: HttpService,
    @InjectModel(CampItemBarcode) private readonly barcodeModel: typeof CampItemBarcode,
    @InjectModel(CampListItem) private readonly campListItemModel: typeof CampListItem,
    @InjectModel(CampList) private readonly campListModel: typeof CampList,
    @InjectModel(DRIVERMASTER) private readonly driverModel: typeof DRIVERMASTER,
    private readonly kinesisService: KinesisStreamService,
  ) { }

  private getHeaders() {
    return {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json',
      'api-key': this.apiKey,
      'customer-code': this.customerCode,
      'ngrok-skip-browser-warning': 'y',
    };
  }

  private getSamplifyErrorDetails(error: any) {
    const data = error?.response?.data;
    const message = data?.message || data?.error || error?.message || 'Unknown Samplify error';
    const code = data?.code || error?.response?.status?.toString();

    return {
      message,
      code,
      status: error?.response?.status || HttpStatus.BAD_GATEWAY,
      data,
    };
  }

  async updateCampPatients(camp_unique_id: string, patient_ref_id: string, patient_data: CampPatientDto) {
    const headers = this.getHeaders();
    try {
      patient_data.test_codes = ["11261"];
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/order/update-camp-patients`, { camp_unique_id, patient_ref_id, patient_data }, {
          headers,
        }),
      );
      return res.data;
    } catch (error) {
      const samplifyError = this.getSamplifyErrorDetails(error);

      throw new HttpException(
        {
          success: false,
          message: `Samplify Patients Error: ${samplifyError.message}`,
          error: samplifyError.message,
          code: samplifyError.code,
          data: samplifyError.data,
        },
        samplifyError.status,
      );
    }
  }


  async addCampPatients(camp_unique_id: string, patients: CampPatientDto[]): Promise<any> {

    const camp = await this.campListModel.findOne({ where: { camp_unique_id } });
    if (!camp) {
      throw new NotFoundException('Camp not found');
    }


    if (!patients || patients.length === 0) {
      throw new HttpException('No patients provided', HttpStatus.BAD_REQUEST);
    }

    patients.forEach(patient => {
      patient.test_codes = ["11261"];
    });

    const url = `${this.baseUrl}/order/add-camp-patients`;
    const body = { camp_unique_id, patients };
    const headers = this.getHeaders();

    console.log('API Request:');

    try {
      const { data: res } = await firstValueFrom(
        this.httpService.post(url, body, { headers })
      );

      console.log('API Response:', res);

      if (!res?.success) {
        throw new HttpException(
          `Samplify API Error: ${res?.message || res?.error || 'Failed to add patients'}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return res;
    } catch (error) {
      if (error.response) {
        // Axios-like error from HttpService
        const message = error.response.data?.message || error.response.statusText || error.message;
        throw new HttpException(
          `Samplify API Error: ${message}`,
          error.response.status || HttpStatus.BAD_GATEWAY,
        );
      }
      throw new HttpException(
        `Samplify Patients Error: ${error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async createCustomerCamp(payload: CreateCustomerCampDto) {
    try {

      const camp = await this.campListModel.findOne({ where: { camp_ref_id: payload.camp_ref_id } });
      if (!camp) throw new NotFoundException('Camp not found');

      const url = `${this.baseUrl}/order/create-customer-camps`;
      const headers = this.getHeaders();
      payload.camp_patients = [];
      console.log('API Request:', {
        url,
        method: 'POST',
        headers,
        payload
      });

      payload.test_codes = ["11261"];
      const res = await firstValueFrom(
        this.httpService.post(url, payload, {
          headers
        })
      )

      camp.camp_unique_id = res.data.camp_unique_id;
      camp.statusSamplify = "CAMP_CONFIRMED";
      await camp.save();
      return res.data;

    } catch (error) {
      throw new HttpException(
        `Samplify Create Customer Camp Error: ${error.response?.data?.message || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async fetchCustomerCamp(camp_unique_id: string) {
    try {
      const headers = this.getHeaders();
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/order/fetch-customer-camps`, { camp_unique_id }, {
          headers,

        }),
      );
      return res.data;
    } catch (error) {
      throw new HttpException(
        `Samplify Fetch Customer Camp Error: ${error.response?.data?.message || error.response?.data}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async updateCustomerCamp(camp_unique_id: string, payload: CreateCustomerCampDto) {
    try {
      const headers = this.getHeaders();
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/order/update-customer-camps`, { camp_unique_id, ...payload }, {
          headers
        }),
      );
      return res.data;
    } catch (error) {
      throw new HttpException(
        `Samplify Update Customer Camp Error: ${error.response?.data?.message || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async deleteCustomerCamp(camp_unique_id: string) {
    try {
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/order/delete-customer-camps`, { camp_unique_id }, {
          headers: this.getHeaders(),
        }),
      );
      return res.data;
    } catch (error) {
      throw new HttpException(
        `Samplify Delete Customer Camp Error: ${error.response?.data?.message || error.message}`,
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  async createCampListDB_to_Samplify() {
    const camps = await this.campListModel.findAll();

    for (const camp of camps) {
      if (!camp.camp_unique_id) {
        await this.createCustomerCamp({
          camp_ref_id: camp.camp_ref_id,
          date: camp.scheduled_on,
          address: camp.location_text,
          camp_spoc_name: camp.camp_spoc_name,
          camp_spoc_phone: camp.camp_spoc_phone,
          camp_spoc_email: camp.camp_spoc_email,
          pincode: camp.pincode,
          corporate_name: camp.corporate_name,
          remark: camp.remark,
        });
      }
    }
    return { success: true, message: 'Camp list from DB created to Samplify' };
  }

  async createCamp_to_Samplify(camp_id: number) {
    const camp = await this.campListModel.findOne({ where: { id: camp_id } });
    if (!camp) {
      throw new NotFoundException('Camp not found');
    }
    if (camp.camp_unique_id) {
      return { success: true, message: 'Camp already created to Samplify' };
    }
    const data = await this.createCustomerCamp({
      camp_ref_id: camp.camp_ref_id,
      date: camp.scheduled_on,
      address: camp.location_text,
      camp_spoc_name: camp.camp_spoc_name,
      camp_spoc_phone: camp.camp_spoc_phone,
      camp_spoc_email: camp.camp_spoc_email,
      pincode: camp.pincode,
      corporate_name: camp.corporate_name,
      remark: camp.remark ?? "Camp added by LMC",
    });

    return { success: true, message: 'Camp created to Samplify', data: data };
  }


  async updateCamp_to_Samplify() {
    const camps = await this.campListModel.findAll();
    for (const camp of camps) {
      if (camp.camp_unique_id) {
        await this.updateCustomerCamp(camp.camp_unique_id, {
          camp_ref_id: camp.camp_ref_id,
          date: camp.scheduled_on,
          address: camp.location_text,
          camp_spoc_name: camp.camp_spoc_name,
          camp_spoc_phone: camp.camp_spoc_phone,
          camp_spoc_email: camp.camp_spoc_email,
          pincode: camp.pincode,
          corporate_name: camp.corporate_name,
          remark: camp.remark,
        });
      }
    }
    return { success: true, message: 'Camp list from DB updated to Samplify' };
  }


  async updatePhlebotomistAndBarcodeData(payload: {
    camp_unique_id: string;
    camp_patients: any[];
    phlebo_details: phelboDTO[]
  }) {
    const { camp_unique_id, camp_patients, phlebo_details } = payload;
    this.logger.log(`[updatePhlebotomistAndBarcodeData] Step 1: Request received for camp ${camp_unique_id || 'unknown'}`);
    const safePatients = Array.isArray(camp_patients) ? camp_patients : [];
    const safePhlebotomists = Array.isArray(phlebo_details) ? phlebo_details : [];
    this.logger.log(
      `[updatePhlebotomistAndBarcodeData] Step 2: Payload stats - patients: ${safePatients.length}, phlebotomists: ${safePhlebotomists.length}`,
    );
    this.logger.debug(
      `[updatePhlebotomistAndBarcodeData] Step 2.1: First patient refs: ${safePatients
        .slice(0, 5)
        .map((patient: any) => patient?.patient_ref_id || 'NA')
        .join(', ') || 'none'}`,
    );
    this.logger.debug(
      `[updatePhlebotomistAndBarcodeData] Step 2.2: First phlebotomist phones: ${safePhlebotomists
        .slice(0, 5)
        .map((phlebo: phelboDTO) => phlebo?.phone || 'NA')
        .join(', ') || 'none'}`,
    );

    this.logger.log(`[updatePhlebotomistAndBarcodeData] Step 3: Fetching camp by camp_unique_id`);
    const camp = await this.campListModel.findOne({ where: { camp_unique_id } });
    if (!camp) throw new NotFoundException('Camp not found');
    this.logger.log(`[updatePhlebotomistAndBarcodeData] Step 4: Camp found with id ${camp.id}`);

    if (!streamName) {
      this.logger.error('[updatePhlebotomistAndBarcodeData] Step 5: Kinesis stream name is not configured');
      throw new InternalServerErrorException('Kinesis stream is not configured');
    }
    this.logger.log(`[updatePhlebotomistAndBarcodeData] Step 5: Kinesis stream resolved as ${streamName}`);

    // Samplify sometimes sends report_metadata instead of parameter_metadata.
    // Normalize before pushing to the worker so processing remains backward compatible.
    this.logger.log('[updatePhlebotomistAndBarcodeData] Step 6: Normalizing patient metadata');
    const normalizedPatients = safePatients.map((patient: any) => ({
      ...patient,
      parameter_metadata: patient?.parameter_metadata ?? patient?.report_metadata ?? null,
    }));
    const normalizedMetadataCount = normalizedPatients.filter((patient: any) => Array.isArray(patient?.parameter_metadata)).length;
    this.logger.log(
      `[updatePhlebotomistAndBarcodeData] Step 6.1: Metadata normalization complete - ${normalizedMetadataCount}/${normalizedPatients.length} patients have parameter_metadata`,
    );

    const normalizedPayload = {
      ...payload,
      camp_patients: normalizedPatients,
    };

    try {
      this.logger.log('[updatePhlebotomistAndBarcodeData] Step 7: Sending payload to Kinesis');
      await this.kinesisService.putRecord(streamName, normalizedPayload, camp_unique_id);
      this.logger.log(
        `[updatePhlebotomistAndBarcodeData] Step 8: Payload enqueued to Kinesis successfully - stream=${streamName}, partitionKey=${camp_unique_id}`,
      );
    } catch (error) {
      this.logger.error(
        `[updatePhlebotomistAndBarcodeData] Step 7 failed: Failed to enqueue Samplify payload for camp ${camp_unique_id}: ${error?.message || error}`,
        (error as any)?.stack,
      );
      throw new InternalServerErrorException('Failed to enqueue camp update');
    }

    // Return only serializable summary fields; do not echo the full request payload.
    return {
      success: true,
      message: 'Camp has been updated',
      camp_unique_id: camp.camp_unique_id,
      patient_count: safePatients.length,
      phlebotomist_count: safePhlebotomists.length,
    };

  }


  async addCampPatientId_(driver_id: number, camp_unique_id: string) {
    const camp = await this.campListModel.findOne({ where: { camp_unique_id } });
    if (!camp) throw new NotFoundException('Camp not found');
    const driver = await this.driverModel.findByPk(driver_id);
    if (!driver) throw new NotFoundException('Driver not found');
    const patient = await this.campListItemModel.findOne({ where: { driver_id, camp_id: camp.id } });
    if (!patient) throw new NotFoundException('Patient not found');

    const first_name = driver.name.split(' ')[0];
    const last_name = driver.name.split(' ')[1];
    const patients = [{ patient_ref_id: driver.employeeId, first_name: first_name, last_name: last_name, gender: driver.gender, age: driver.age }]
    await this.addCampPatients(camp_unique_id, patients);
    return { success: true };
  }

  async addCampPatientId(driver_id: number[], camp_unique_id: string) {
    const camp = await this.campListModel.findOne({ where: { camp_unique_id } });
    if (!camp) throw new NotFoundException('Camp not found');
    const drivers = await this.driverModel.findAll({ where: { id: driver_id } });
    if (!drivers) throw new NotFoundException('Driver not found');

    const patients = drivers.map((driver) => {
      const nameParts = (driver.name || 'Unknown Driver').trim().split(/\s+/);
      const first_name = nameParts[0] || 'Unknown';
      const last_name = nameParts.slice(1).join(' ') || 'Driver';
      return { patient_ref_id: driver.employeeId, first_name: first_name, last_name: last_name, gender: driver.gender, age: driver.age }
    })

    let res;
    try {
      res = await this.addCampPatients(camp_unique_id, patients);
    } catch (error) {
      // addCampPatients already throws HttpException/NotFound, but catch here to return structured error
      return {
        success: false,
        message: error.message || 'Failed to add patients to Samplify',
      };
    }


    camp.statusSamplify = 'PATIENTS_CONFIRMED';
    await camp.save();

    const campListItems = await this.campListItemModel.findAll({
      where: {
        driver_id: { [Op.in]: driver_id },
        camp_id: camp.id,
      },
    });

    if (campListItems.length !== driver_id.length) {
      throw new NotFoundException('One or more camp list items not found');
    }

    // Update all items
    const updatePromises = campListItems.map((item) => {
      item.added_to_samplify = true;
      return item.save();
    });
    await Promise.all(updatePromises);

    return {
      success: true,
      patients,
      data: res,
    };

  }

  async BulkAddDriverstoSamplify(camp_id: number, center_id: number) {
    const camp = await this.campListModel.findByPk(camp_id);
    if (!camp) throw new NotFoundException('Camp not found');
    if (!camp.camp_unique_id) throw new NotFoundException('Camp Not made to Samplify');
    if (!camp.center_id || camp.center_id !== center_id) throw new NotFoundException('Camp not found');

    // find the drivers where there is added_to_samplify is false
    const drivers = await this.campListItemModel.findAll({ where: { camp_id: camp.id, added_to_samplify: false } });
    console.log(drivers);
    if (!drivers || drivers.length === 0) return { success: false, message: 'No drivers found to be added.. to Samplify' };

    const driver_ids = drivers.map((driver) => driver.driver_id);
    const res = await this.addCampPatientId(driver_ids, camp.camp_unique_id);
    return res;

  }


  async sendBarCodeToSamplify(driver_id: number, camp_unique_id: string) {
    // 1. Find Camp
    const camp = await this.campListModel.findOne({ where: { camp_unique_id } });
    if (!camp) throw new NotFoundException('Camp not found');

    // 2. Find Driver
    const driver = await this.driverModel.findByPk(driver_id);
    if (!driver) throw new NotFoundException('Driver not found');

    // 3. Find Patient (camp_list_item) linked to driver + camp
    const patient = await this.campListItemModel.findOne({
      where: { driver_id, camp_id: camp.id },
    });
    if (!patient) throw new NotFoundException('Patient not found for this driver and camp');

    // 4. Get all barcodes for this patient
    const barcodes = await this.barcodeModel.findAll({
      where: { camp_list_item_id: patient.id },
      attributes: ['code', 'test_name'],
    });

    if (barcodes.length === 0) {
      return { success: false, message: 'No barcodes found for this patient' };
    }

    // 5. Map barcodes to Samplify format
    const specimens = barcodes.map(barcode => ({
      barcode: barcode.code,
      name: barcode.test_name,
    }));

    // 6. Split name safely
    const nameParts = (driver.name || 'Unknown Driver').trim().split(/\s+/);
    const first_name = nameParts[0] || 'Unknown';
    const last_name = nameParts.slice(1).join(' ') || 'Driver';

    const trf_barcode = patient.trf_number;
    const sample_collection_time = new Date().toISOString();

    // 7. Prepare Samplify payload
    const samplifyPayload = {
      patient_ref_id: driver.employeeId,
      first_name,
      last_name,
      gender: driver.gender,
      age: driver.age || 30,
      specimen_barcodes: {
        specimens,
      },
      trf_barcode,
      sample_collection_time,
    };

    // 8. Send to Samplify
    try {
      await this.updateCampPatients(camp_unique_id, driver.employeeId, samplifyPayload);
    } catch (error: any) {
      const errorResponse = typeof error?.getResponse === 'function' ? error.getResponse() : undefined;
      const errorMessage = typeof errorResponse === 'object' && errorResponse !== null
        ? (errorResponse as any).message || (errorResponse as any).error
        : error?.message;

      return {
        success: false,
        message: `Failed to send barcode to Samplify: ${errorMessage || 'Unknown Samplify error'}`,
        error: typeof errorResponse === 'object' && errorResponse !== null
          ? (errorResponse as any).error || errorMessage
          : errorMessage,
        code: typeof errorResponse === 'object' && errorResponse !== null ? (errorResponse as any).code : undefined,
      };
    }

    return {
      success: true,
      message: 'Barcodes sent to Samplify successfully',
      camp_unique_id,
      patient_ref_id: driver.employeeId,
      barcode_count: barcodes.length,
      specimens: specimens,
    };
  }

  async BulkSendBarCodeToSamplify(camp_id: number, center_id: number) {
    const camp = await this.campListModel.findByPk(camp_id);
    if (!camp) throw new NotFoundException('Camp not found');
    if (!camp.camp_unique_id) throw new NotFoundException('Camp Not made to Samplify');
    if (!camp.center_id || camp.center_id !== center_id) throw new NotFoundException('Camp not found');

    const patients = await this.campListItemModel.findAll({ where: { camp_id: camp.id } });
    const ress = [];
    for (const patient of patients) {
      const res = await this.sendBarCodeToSamplify(patient.driver_id, camp.camp_unique_id);
      ress.push(res);
      if (res.success) {
        camp.statusSamplify = "BarCodeSent";
        await camp.save();
      }
    }


    const failedResults = ress.filter((result) => !result?.success);
    const successCount = ress.length - failedResults.length;
    const isSuccess = failedResults.length === 0;
    const firstError = failedResults[0]?.error || failedResults[0]?.message;

    return {
      success: isSuccess,
      message: isSuccess
        ? 'Barcodes sent to Samplify successfully'
        : firstError || 'Failed to send one or more health records to Samplify',
      camp_unique_id: camp.camp_unique_id,
      patient_count: patients.length,
      success_count: successCount,
      failed_count: failedResults.length,
      data: ress,
    };
  }
}
