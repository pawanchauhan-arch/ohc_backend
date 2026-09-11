import { HttpException, HttpStatus, Injectable, UnauthorizedException, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import { JslRequestDto } from './dto/jsl-request.dto';
import { JslSurveyResponse, isJslSurveyResponse, JslSurveyDetails } from './models/jsl-response.model';
import { InjectModel } from '@nestjs/sequelize';
import { JslShipmentDetailModel } from 'src/models/jsl-shipment-detail.model';

/**
 * Service responsible for integrating with the external JSL CPI endpoint.
 */
@Injectable()
export class JslIntegrationService {
  constructor(
    private readonly httpService: HttpService,
    @InjectModel(JslShipmentDetailModel)
    private readonly jslShipmentModel: typeof JslShipmentDetailModel,
  ) {}

  /**
   * Send the driver serial number to JSL CPI and validate the downstream response.
   * @param input Payload containing the serial number.
   * @returns The validated survey response from JSL CPI.
   */
  async sendJslRequest(input: JslRequestDto): Promise<JslSurveyResponse> {
    const url: string | undefined = process.env.JSL_LMC_URL;
    const user: string | undefined = process.env.JSL_LMC_USER;
    const pass: string | undefined = process.env.JSL_LMC_PASSWORD;
    if (!url || !user || !pass) {
      throw new UnauthorizedException('JSL credentials are not configured');
    }
    if (!input?.Serno) {
      throw new BadRequestException('Serno is required');
    }
    const basicAuthToken: string = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
    const headers = {
      Authorization: `Basic ${basicAuthToken}`,
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
    };
    const payload = {
      Serno: input.Serno,
      SERNO: input.Serno,
    };
    try {
      const response: AxiosResponse = await lastValueFrom(this.httpService.post(url, payload, { headers }));
      const data: unknown = response.data;
      if (!isJslSurveyResponse(data)) {
        throw new NotFoundException('JSL survey data not found for the provided Serno');
      }
      await this.persistSurvey(data);
      return data;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (axios.isAxiosError(error)) {
        const status: number = error.response?.status ?? HttpStatus.BAD_GATEWAY;
        const message: string = typeof error.response?.data === 'string' ? error.response.data : error.message;
        throw new HttpException(`JSL upstream request failed: ${message}`, status);
      }
      throw new InternalServerErrorException('Unexpected error while processing JSL response');
    }
  }

  private async persistSurvey(response: JslSurveyResponse): Promise<void> {
    const survey: JslSurveyDetails = response.ZODATA_GE_SURVEY_LMCSet.ZODATA_GE_SURVEY_LMC;
    const cleanedRecord = {
      serno: survey.Serno.trim(),
      tdlnr: this.cleanString(survey.Tdlnr),
      tranName: this.cleanString(survey.TranName),
      vehNo: this.cleanString(survey.VehNo),
      outbInDate: this.parseDate(survey.OutbInDate),
      outbInTime: this.cleanString(survey.OutbInTime),
      zdelete: this.cleanString(survey.Zdelete),
      tknum: this.cleanString(survey.Tknum),
      drname: this.cleanString(survey.Drname),
      conno: this.cleanString(survey.Conno),
      licno: this.cleanString(survey.Licno),
      drvDob: this.parseDate(survey.DrvDOB),
      age: this.parseAge(survey.Age),
      gender: this.cleanString(survey.Gender),
      rawPayload: JSON.parse(JSON.stringify(response)) as Record<string, unknown>,
      fetchedAt: new Date(),
      updatedAt: new Date(),
    };
    await this.jslShipmentModel.upsert(cleanedRecord);
  }

  private cleanString(value?: string): string | null {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseDate(value?: string): Date | null {
    const trimmed = this.cleanString(value);
    if (!trimmed) return null;
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private parseAge(value?: string): number | null {
    const trimmed = this.cleanString(value);
    if (!trimmed) return null;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? null : parsed;
  }
}


