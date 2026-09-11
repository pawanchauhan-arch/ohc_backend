// services/mobilab.service.ts
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { InjectModel } from '@nestjs/sequelize';
import { MobilabBooking } from '../../models/MobilabTestResult';
import { DRIVERMASTER } from '../../models/DriverMaster';
import { driverhealthcheckup } from '../../models/DriverHealthCheckup';
import { Center } from '../../models/Center'; // Import Center Model
import {
  AvailableTest,
  AvailableProfile,
  CreateMobileUserDto,
  MobileUser,
  MobilabUserCenter,
  UpdateMobileUserDto,
  DeviceDetail,
  BookTestDto,
  TestResultDetails,
  AccessTokenResponse,
  TestItemDto
} from './mobilab.dto';
import { LabResultService } from './lab-result.service';
import { resolveAgeFromDateOfBirthOrAge } from '../../utils/patient-age.util';
import { BmiMeasurements, extractBmiMeasurements } from '../../utils/health-checkup-bmi.util';

const DEFAULT_PATIENT_AGE = 24;
const DEFAULT_PATIENT_HEIGHT_CM = 170;
const DEFAULT_PATIENT_WEIGHT_KG = 70;

@Injectable()
export class MobilabService {
  private readonly baseUrl = 'https://emobilab.in/api-vendor';
  private readonly secretKey = process.env.MOBILAB_SECRET_KEY;
  private accessToken: string | null = null;
  private readonly logger = new Logger(MobilabService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(MobilabBooking)
    private readonly bookingModel: typeof MobilabBooking,
    @InjectModel(DRIVERMASTER)
    private readonly driverMasterModel: typeof DRIVERMASTER,
    @InjectModel(driverhealthcheckup)
    private readonly driverHealthCheckupModel: typeof driverhealthcheckup,
    @InjectModel(Center)
    private readonly centerModel: typeof Center, // Inject Center Model
    private readonly labResultService: LabResultService,
  ) {}

  // --- Helper: Request Wrapper ---
  private async makeRequest<T>(
    endpoint: string,
    body: any = {},
    useAuth = true,
    queryParams = '',
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useAuth) {
      const token = await this.getValidToken();
      headers['mobi-access'] = token;
    }

    const url = `${this.baseUrl}/${endpoint}${queryParams}`;
    const maskedHeaders = {
      ...headers,
      ...(headers['mobi-access']
        ? { 'mobi-access': `${String(headers['mobi-access']).slice(0, 6)}...` }
        : {}),
    };

    this.logger.log(
      `[MobiLab Request] url=${url}, method=POST, useAuth=${useAuth}, query=${queryParams || '-'}, headers=${JSON.stringify(maskedHeaders)}, payload=${JSON.stringify(body)}`,
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(url, body, { headers }),
      );
      
      const data = response.data;

      if (data.error === true) {
        this.logger.warn(
          `[MobiLab Response Error] url=${url}, payload=${JSON.stringify(body)}, response=${JSON.stringify(data)}`,
        );
        if (data.message === 'Test(s) under process') {
           throw new HttpException(data.message, HttpStatus.ACCEPTED);
        }
        throw new HttpException(
          `Mobilab API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `[MobiLab Response] url=${url}, response=${JSON.stringify(data)}`,
      );

      return data;
    } catch (error) {
      this.logger.error(
        `[MobiLab Request Failed] url=${url}, payload=${JSON.stringify(body)}, error=${error?.response?.data?.message || error?.message || 'Unknown error'}`,
      );
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        error.response?.data?.message || error.message || 'Unknown Mobilab Error',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  // --- 1. Authentication ---
  private async getValidToken(): Promise<string> {
    if (this.accessToken) return this.accessToken;

    try {
      const res = await firstValueFrom(
        this.httpService.post(`${this.baseUrl}/getAccessToken.php`, {
          secret_key: this.secretKey,
        }),
      );
      const data: AccessTokenResponse = res.data;
      
      if (data.error || !data['access-token']) {
        throw new Error(data.message || 'Failed to generate token');
      }
      
      this.accessToken = data['access-token'];
      return this.accessToken;
    } catch (error) {
      throw new HttpException('Authentication Failed: ' + error.message, HttpStatus.UNAUTHORIZED);
    }
  }

  // --- API Wrappers ---
  async getAvailableTests(): Promise<AvailableTest[]> {
    const data = await this.makeRequest<any>('getAvailableTests.php');
    return data.tests || [];
  }

  async getAvailableProfiles(): Promise<AvailableProfile[]> {
    const data = await this.makeRequest<any>('getAvailableTests.php', {}, true, '?type=profile');
    return data.profiles || [];
  }
  async getMobileUsers(): Promise<MobileUser[]> {
    const [data, centers] = await Promise.all([
      this.makeRequest<any>('getMobileUser.php'),
      this.centerModel.findAll({
        attributes: ['id', 'project_name', 'project_unique_id', 'short_code', 'mobilab_credentials'],
      }),
    ]);
    const users = (data.user_details || []) as Array<{ status?: string; id?: string; [key: string]: any }>;
    const userCentersMap = new Map<string, MobilabUserCenter[]>();
    for (const center of centers) {
      const creds = center.mobilab_credentials;
      if (creds?.id != null) {
        const userId = String(creds.id);
        const centerInfo: MobilabUserCenter = {
          id: center.id,
          project_name: center.project_name ?? '',
          project_unique_id: center.project_unique_id ?? '',
          short_code: center.short_code,
        };
        const list = userCentersMap.get(userId) || [];
        list.push(centerInfo);
        userCentersMap.set(userId, list);
      }
    }
    return users.map((u) => ({
      ...u,
      status: u.status === '1' ? 'active' : 'inactive',
      centers: userCentersMap.get(String(u.id)) || [],
    })) as MobileUser[];
  }

  async getCenterCredentials(center_id:number) {
    const center = await this.centerModel.findOne({ where: { id: center_id } });
    return center.mobilab_credentials;
  }

  // --- 7. Registered Device List ---
  async getRegisteredDevices(): Promise<DeviceDetail[]> {
    const data = await this.makeRequest<any>('registerDeviceList.php');
    return data.device_details || [];
  }
  // --- Center User Management ---

  /**
   * Ensures a Center exists as a user in Mobilab.
   * - Single centerId + no dto: returns existing credentials (used by booking flow).
   * - centerIds + dto: creates mobilab user and maps to all centers (POST /users).
   */
  async getOrCreateCenterMobilabUser(
    centerIdOrIds: number | number[],
    dto?: CreateMobileUserDto,
  ): Promise<any> {
    const centerIds = Array.isArray(centerIdOrIds) ? centerIdOrIds : [centerIdOrIds];

    if (centerIds.length === 0) {
      throw new HttpException('At least one center_id must be provided', HttpStatus.BAD_REQUEST);
    }

    const centers = await this.centerModel.findAll({
      where: { id: centerIds },
    });

    if (centers.length !== centerIds.length) {
      const foundIds = new Set(centers.map((c) => c.id));
      const missing = centerIds.filter((id) => !foundIds.has(id));
      throw new HttpException(`Center(s) not found: ${missing.join(', ')}`, HttpStatus.NOT_FOUND);
    }

    const centersInfo = centers.map((c) => ({
      id: c.id,
      project_name: c.project_name ?? '',
      project_unique_id: c.project_unique_id ?? '',
      short_code: c.short_code,
    }));

    // GET mode: single center, no dto - return existing credentials (booking flow)
    if (!dto) {
      const center = centers[0];
      if (!center.mobilab_credentials?.id) {
        throw new HttpException(
          `Center ${center.id} has no Mobilab credentials. Create via POST /api/mobilab/users first.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return { ...center.mobilab_credentials, center: centersInfo[0] };
    }

    // CREATE mode: create user and map to all centers
    const existingWithCreds = centers.find(
      (c) =>
        c.mobilab_credentials?.id &&
        c.mobilab_credentials?.username === dto.username,
    );

    if (existingWithCreds) {
      const credentials = existingWithCreds.mobilab_credentials;
      for (const center of centers) {
        if (!center.mobilab_credentials?.id || center.mobilab_credentials.id !== credentials.id) {
          center.mobilab_credentials = {
            id: credentials.id,
            username: credentials.username,
            password: dto.password,
            name: dto.name ?? credentials.name,
          };
          await center.save();
        }
      }
      return { ...credentials, centers: centersInfo };
    }

    try {
      const response = await this.makeRequest<any>('createMobileUser.php', dto);

      const credentials = {
        id: response.user_details.id,
        username: dto.username,
        password: dto.password,
        name: dto.name,
      };

      for (const center of centers) {
        center.mobilab_credentials = credentials;
        await center.save();
      }

      return { ...credentials, centers: centersInfo };
    } catch (error) {
      throw new HttpException(
        `Failed to create Mobilab user: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  
  async updateMobileUser(dto: UpdateMobileUserDto, centerIdOrIds: number | number[]): Promise<MobileUser> {
    const centerIds = Array.isArray(centerIdOrIds) ? centerIdOrIds : [centerIdOrIds];

    if (centerIds.length === 0) {
      throw new HttpException('At least one center_id must be provided', HttpStatus.BAD_REQUEST);
    }

    const apiPayload: Record<string, any> = {
      id: dto.id,
      name: dto.name,
      status: dto.status === 'active' ? '1' : '0',
    };
    if (dto.password) apiPayload.password = dto.password;
    if (dto.phone != null) apiPayload.phone = dto.phone;

    const data = await this.makeRequest<any>('updateMobileUser.php', apiPayload);

    const centers = await this.centerModel.findAll({
      where: { id: centerIds },
    });

    if (centers.length !== centerIds.length) {
      const foundIds = new Set(centers.map((c) => c.id));
      const missing = centerIds.filter((id) => !foundIds.has(id));
      throw new HttpException(`Center(s) not found: ${missing.join(', ')}`, HttpStatus.NOT_FOUND);
    }

    // Get username and password from dto, or from first center that has this mobilab user
    const centerWithCreds = centers.find(
      (c) => c.mobilab_credentials?.id && String(c.mobilab_credentials.id) === String(dto.id),
    );
    const username = dto.username ?? centerWithCreds?.mobilab_credentials?.username ?? '';
    const password = dto.password ?? centerWithCreds?.mobilab_credentials?.password ?? '';

    if (!username) {
      throw new HttpException(
        'Provide username when mapping to centers that do not have this mobilab user yet',
        HttpStatus.BAD_REQUEST,
      );
    }

    const credentials = {
      id: dto.id,
      username,
      password,
      name: dto.name,
    };

    for (const center of centers) {
      center.mobilab_credentials = credentials;
      await center.save();
    }

    return data;
  }

  // --- Booking Logic ---

  /**
   * Internal wrapper for the specific API call
   */
  private async callBookTestApi(dto: BookTestDto): Promise<{ bookingID: number; message: string }> {
    const data = await this.makeRequest<any>('bookTest.php', dto, true);
    return {
      bookingID: data.bookingID,
      message: data.message,
    };
  }

  /**
   * Main Booking Function
   * 1. Finds Driver & Checkup
   * 2. Finds Center from Checkup (or Driver)
   * 3. Gets/Creates Mobilab User for that Center
   * 4. Books test using Center's ID and Driver's Patient Info
   */
  async bookTestForDriver(
    driver_id: number, 
    health_checkup_id: number, 
    tests?: TestItemDto[]
  ): Promise<{ bookingID: number; message: string }> {
    
    // 1. Fetch Entities
    const driver = await this.driverMasterModel.findOne({ where: { id: driver_id } });
    if (!driver) throw new HttpException('Driver not found', HttpStatus.NOT_FOUND);

    const healthCheckup = await this.driverHealthCheckupModel.findOne({ where: { id: health_checkup_id } });
    if (!healthCheckup) throw new HttpException('Health Checkup not found', HttpStatus.NOT_FOUND);

    const hasTests = !!(tests && tests.length > 0);
    if (!hasTests) {
      throw new HttpException('At least one test must be provided', HttpStatus.BAD_REQUEST);
    }

    // 2. Identify Center
    // Assuming healthCheckup has `center_id` (where the test is conducted)
    // If not, fall back to `driver.center_id` or `createdBy` field
    const centerId = healthCheckup.createdBy; 
    
    if (!centerId) {
        throw new HttpException('Center ID not associated with this Health Checkup', HttpStatus.BAD_REQUEST);
    }

    // 3. Get Center Credentials (Mobilab User)
    const centerCreds = await this.getOrCreateCenterMobilabUser(centerId);
    
    // 4. Resolve patient age and latest BMI measurements
    const patientAge = resolveAgeFromDateOfBirthOrAge(
      driver.dateOfBirthOrAge,
      driver.age || DEFAULT_PATIENT_AGE,
    );
    const bmiMeasurements = await this.getLatestBmiMeasurements(driver_id);
    const height = bmiMeasurements?.height ?? DEFAULT_PATIENT_HEIGHT_CM;
    const weight = bmiMeasurements?.weight ?? DEFAULT_PATIENT_WEIGHT_KG;

    // 5. Prepare Payload
    // ID = Center's Mobilab User ID
    // Patient Details = Driver's Info
    const selectedTests = tests;
    const selectedPayload = selectedTests ?? null;

    const bookingDto: BookTestDto = {
      id: centerCreds.id, 
      fullname: driver.name,
      age: patientAge,
      gender: driver.gender ? driver.gender.toLowerCase() : 'male',
      height: height,
      weight: weight,
      phone: driver.contactNumber || null,
      tests: selectedTests,
    };

    // 6. Call API
    const { bookingID, message } = await this.callBookTestApi(bookingDto);

    // 7. Save to Database
    try {
      await this.bookingModel.create({
        booking_id: bookingID.toString(),
        patient_fullname: bookingDto.fullname,
        patient_age: bookingDto.age,
        patient_gender: bookingDto.gender,
        patient_phone: bookingDto.phone || null,
        requested_payload: selectedPayload,
        status: 'PENDING',
        results: null,
        driver_id: driver_id,
        health_checkup_id: health_checkup_id,
        center_id: centerId, // Store which center booked it
      });
    } catch (dbError) {
      console.error('DB Insert Error:', dbError);
      // We do not throw here because the vendor booking was successful
    }

    return { bookingID, message };
  }


  /**
   * Fetches height and weight from the driver's most recent health checkup with BMI data.
   */
  private async getLatestBmiMeasurements(driverId: number): Promise<BmiMeasurements | null> {
    const healthCheckups = await this.driverHealthCheckupModel.findAll({
      where: { driver_id: driverId },
      order: [['createdAt', 'DESC']],
      attributes: ['selected_test'],
    });
    for (const checkup of healthCheckups) {
      const measurements = extractBmiMeasurements(checkup.selected_test);
      if (measurements) {
        return measurements;
      }
    }
    return null;
  }

  // --- Results Handling ---

  async getAndSaveTestResults(bookingID: string): Promise<TestResultDetails> {
    const payload = { bookingID: bookingID };
    
    let data;
    try {
        data = await this.makeRequest<any>('getTestResults.php', payload);
    } catch (e) {
        if (e.status === HttpStatus.ACCEPTED) {
            throw e; 
        }
        throw e;
    }

    const details: TestResultDetails = data.details;

    if (!details || !details.test_results) {
        throw new HttpException('No result details found', HttpStatus.NOT_FOUND);
    }

    const validResults = details.test_results.filter(
      r => r && r.calculated_value !== null && r.calculated_value !== undefined
    );

    if (validResults.length === 0) {
      throw new HttpException('Test results exist but no calculated values found', HttpStatus.BAD_REQUEST);
    }

    try {
        const booking = await this.bookingModel.findOne({ where: { booking_id: bookingID } });

        if (booking) {
           await booking.update({
                results: details.test_results,
                status: 'COMPLETED',
           });
           
           // Pass results to lab result processor
           await this.labResultService.processLabResults(booking.health_checkup_id, details.test_results);
        } 
    } catch (dbError) {
        console.error('Failed to update Mobilab results in DB:', dbError);
    }
    return details;
  }

  // --- Utility ---

  async logout(): Promise<{ message: string }> {
    const data = await this.makeRequest<any>('logout.php');
    this.accessToken = null;
    return { message: data.message };
  }

  async getBookingId(driver_id: number, health_checkup_id: number): Promise<{ bookingID: string; message: string }> {
    const mobilabBooking = await this.bookingModel.findOne({ 
      where: { driver_id: driver_id, health_checkup_id: health_checkup_id } 
    });
    
    if (!mobilabBooking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }
    return { bookingID: mobilabBooking.booking_id, message: 'Booking found' };
  }

  async getResults(driver_id: number, health_checkup_id: number) {
    const mobilabBooking = await this.bookingModel.findOne({ 
      where: { driver_id: driver_id, health_checkup_id: health_checkup_id } 
    });

    if (!mobilabBooking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }
    if (!mobilabBooking.results) {
      throw new HttpException('Results not found', HttpStatus.NOT_FOUND);
    }
    return { results: mobilabBooking.results, message: "Results found successfully" };
  }
}