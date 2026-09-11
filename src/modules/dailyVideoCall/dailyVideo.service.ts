import {
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import { AWS_REGION, BUCKET_NAME_BANNER, BUCKET_NAME_RECORDING, DAILY_API_KEY } from 'config/envConfig';
import { Consultation } from 'src/models/Consultation';
import { ConsultationRecording } from 'src/models/consultationRecording';
import { NotificationsService } from '../notifications/notifications.service';
import { v4 as uuidv4 } from 'uuid';
import { uploadStreamToS3 } from 'src/utils/s3-image-upload';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';

/**
 * Service for handling Daily.co video call integration, including room creation, token generation,
 * recording management, and saving recordings to S3 and the database.
 */
@Injectable()
export class DailyVideoService {
  private readonly logger = new Logger(DailyVideoService.name);
  private readonly DAILY_API_URL = 'https://api.daily.co/v1';
  private readonly API_KEY = DAILY_API_KEY;
  private S3_BUCKET = BUCKET_NAME_RECORDING;
  private S3_REGION = AWS_REGION;

  constructor(
    @InjectModel(Consultation)
    private consultationModel: typeof Consultation,
    @InjectModel(ConsultationRecording)
    private consultationRecordingModel: typeof ConsultationRecording,
    private readonly notificationsService: NotificationsService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Make a request to the Daily.co API.
   */
  private async dailyRequest(
    method: 'post' | 'get',
    endpoint: string,
    data?: any,
  ) {
    try {
      this.logger.debug(`[DailyRequest] ${method.toUpperCase()} ${endpoint} | Data: ${JSON.stringify(data)}`);
      
      const response = await axios({
        method,
        url: `${this.DAILY_API_URL}${endpoint}`,
        headers: {
          Authorization: `Bearer ${this.API_KEY}`,
          'Content-Type': 'application/json',
        },
        data,
      });
      this.logger.debug(`[DailyRequest] Response: ${JSON.stringify(response.data)}`);
      return response.data;
    } catch (error) {
      this.logger.error(
        `[DailyRequest] Error at ${endpoint}: ${JSON.stringify(error?.response?.data) || error.message}`
      );
      throw new HttpException('Failed to communicate with Daily.co', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Create a recordable room with raw-tracks.
   * @param roomName The name of the room.
   * @param scheduledTime The scheduled time for the room (ISO string).
   */
  async createRoom(roomName: string, scheduledTime: string) {
    this.logger.log(`Creating room: ${roomName} at ${scheduledTime}`);
    if (!process.env.BUCKET_NAME_RECORDING || !process.env.AWS_REGION || !process.env.S3AccessKey || !process.env.SecretKey) {
      this.logger.error('Missing S3 environment variables');
      throw new HttpException('S3 configuration error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const scheduledTimestamp = Math.floor(new Date(scheduledTime).getTime() / 1000);
    const nbf = scheduledTimestamp - 60;
    const exp = scheduledTimestamp + 1800;

    const roomConfig = {
      name: roomName,
      privacy: 'private',
      properties: {
        nbf,
        exp,
        enable_knocking: true,
        geo: 'ap-south-1',
        enable_chat: true,
        enable_screenshare: true,
        enable_video_processing_ui: true,
        // Use 'cloud' for cloud recording. To use raw-tracks, uncomment the next line and comment the 'cloud' line.
        // enable_recording: 'raw-tracks',
        enable_recording: 'cloud',
        enable_multiparty_adaptive_simulcast: true,
        recordings_bucket: {
          bucket_name: BUCKET_NAME_RECORDING,
          bucket_region: AWS_REGION,
          // access_key_id: process.env.S3AccessKey,
          // secret_access_key: process.env.SecretKey,
          "assume_role_arn": "arn:aws:iam::211125448676:role/lmcNewDaily",
          "allow_api_access": true
        },
      },
    };

    const room = await this.dailyRequest('post', '/rooms', roomConfig);

    this.logger.log(`Room created: ${room.name} | URL: ${room.url}`);
    return {
      roomName: room.name,
      url: room.url,
    };
  }

  /**
   * Generate a token for a participant to join a room using Daily.co API.
   * Calls the /meeting-tokens endpoint instead of generating JWT manually.
   * @param roomName The room name.
   * @param userName The participant's name.
   */
  async generateToken(roomName: string, userName: string) {
    this.logger.log(`Generating token for room: ${roomName}, user: ${userName}`);
    if (!roomName || !userName) {
      this.logger.error('Missing roomName or userName for token generation');
      throw new HttpException('roomName and userName are required', HttpStatus.BAD_REQUEST);
    }

    // Prepare the payload for the Daily.co API
    const payload = {
      properties: {
        room_name: roomName,
        // user_name: userName,
        // enable_recording: 'raw-tracks', // or 'cloud' if you want cloud recording
        enable_recording: 'cloud', // or 'cloud' if you want cloud recording
      },
    };

    try {
      const response = await axios.post(
        'https://api.daily.co/v1/meeting-tokens',
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.API_KEY}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      this.logger.debug(`Token generated for user: ${userName}`);
      return { token: response.data.token };
    } catch (error) {
      this.logger.error(`Failed to generate meeting token: ${error.message}`);
      throw new HttpException('Failed to generate meeting token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  
  /**
   * End consultation, stop recording, fetch, upload to S3, and save to DB.
   * @param consultationId The consultation ID.
   * @param roomName The room name.
   */
  async handleEndConsultation(consultationId: string, roomName: string) {
    try {
      this.logger.log(`Fetching recordings for room: ${roomName}`);
  
      // 1. Fetch recordings from Daily
      const { data } = await axios.get(
        `${this.DAILY_API_URL}/recordings?room_name=${roomName}`,
        {
          headers: { Authorization: `Bearer ${this.API_KEY}` },
        }
      );
  
      this.logger.debug(`Daily API full response: ${JSON.stringify(data, null, 2)}`);
  
      if (!data?.data?.length) {
        this.logger.warn(`No recordings found for room: ${roomName}`);
        throw new HttpException('No recordings found for this room', HttpStatus.NOT_FOUND);
      }
  
      const insertedRecords = [];
  
      // 2. Loop over recordings
      for (const rec of data.data) {
        this.logger.log(`Processing recording ID: ${rec.id}`);
        this.logger.debug(`Recording object: ${JSON.stringify(rec, null, 2)}`);
  
        if (!rec.s3key) {
          this.logger.warn(`Recording ${rec.id} has no s3key, skipping...`);
          continue;
        }
  
        // Build S3 URL directly
        const s3Url = `https://${this.S3_BUCKET}.s3.${this.S3_REGION}.amazonaws.com/${rec.s3key}`;
        this.logger.log(`Generated S3 URL: ${s3Url}`);
  
        // Option A — Always treat as video with both audio+video
        const videoLink = s3Url;
        const audioLink = '';
  
        // 3. Insert into DB
        const saved = await this.consultationRecordingModel.create({
          id: uuidv4(),
          consultation_id: consultationId,
          doctor_audio: '',
          doctor_video: '',
          driver_audio: '',
          driver_video: '',
          audio_link: audioLink,
          video_link: videoLink,
          transcript: '',
        });
  
        this.logger.debug(`Inserted DB record: ${JSON.stringify(saved.toJSON(), null, 2)}`);
        insertedRecords.push(saved);
      }
  
      return {
        message: 'Consultation ended, recordings saved',
        records: insertedRecords,
      };
    } catch (error) {
      this.logger.error(`Failed to end consultation: ${error.message}`);
      throw new HttpException(
        error.response?.data || 'Failed to end consultation',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  
}
  