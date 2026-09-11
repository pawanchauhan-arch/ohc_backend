import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import axios from 'axios';
import {
  TEST_TWILIO_ACCOUNT_SID,
  TEST_TWILIO_API_KEY_SECRET,
  TEST_TWILIO_API_KEY_SID,

  TWILIO_ACCOUNT_SID,
  TWILIO_API_KEY_SECRET,
  TWILIO_API_KEY_SID,
} from 'config/envConfig';
// import { UUIDV4 } from 'sequelize';
import { Consultation } from 'src/models/Consultation';
import { ConsultationRecording } from 'src/models/consultationRecording';
import { uploadStreamToS3 } from 'src/utils/s3-image-upload';
import { Twilio } from 'twilio';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority } from 'src/models/notification.model';

@Injectable()
export class ConsultationRecordingService {
  private twilioClient: Twilio;

  constructor(
    @InjectModel(ConsultationRecording)
    private recordingModel: typeof ConsultationRecording,

    @InjectModel(Consultation)
    private consultationModel: typeof Consultation,

     private readonly notificationsService: NotificationsService,
  ) {
    // ✅ Proper Twilio Video SDK initialization using API Key SID/Secret
    // this.twilioClient = new Twilio(
    //   TEST_TWILIO_API_KEY_SID,
    //   TEST_TWILIO_API_KEY_SECRET,
    //   { accountSid: TEST_TWILIO_ACCOUNT_SID },
    // );
    this.twilioClient = new Twilio(
      TWILIO_API_KEY_SID,
      TWILIO_API_KEY_SECRET,
      { accountSid: TWILIO_ACCOUNT_SID },
    );
  }

  async createRecording(data: Partial<ConsultationRecording>) {
    return this.recordingModel.create(data);
  }

  async getRecordingById(id: string) {
    return this.recordingModel.findByPk(id);
  }

  async getRecordingsByConsultationId(consultationId: string) {
    return this.recordingModel.findAll({
      where: { consultation_id: consultationId },
    });
  }

  async updateRecording(id: string, data: Partial<ConsultationRecording>) {
    await this.recordingModel.update(data, { where: { id } });
    return this.getRecordingById(id);
  }

  async deleteRecording(id: string) {
    return this.recordingModel.destroy({ where: { id } });
  }

  // ✅ Create Twilio Video Room
  // async createVideoRoom(roomName: string) {
  //   const room = await this.twilioClient.video.v1.rooms.create({
  //     uniqueName: roomName,
  //     type: 'group',
  //     recordParticipantsOnConnect: true,
  //   });
  //   return room;
  // }

  async createVideoRoom(roomName: string) {
    const room = await this.twilioClient.video.v1.rooms.create({
      uniqueName: roomName,
      type: 'group',
      recordParticipantsOnConnect: true,
      recordingMode: 'composed',
      videoCodecs: ['VP8'],
      unusedRoomTimeout: 60,
    } as any); // <-- Force cast here
    return room;
  }

  // ✅ Generate Twilio Video Token
  async generateAccessToken(identity: string, roomName: string) {
    const AccessToken = require('twilio').jwt.AccessToken;
    const VideoGrant = AccessToken.VideoGrant;

    // const token = new AccessToken(
    //   process.env.TEST_TWILIO_ACCOUNT_SID,
    //   process.env.TEST_TWILIO_API_KEY_SID,
    //   process.env.TEST_TWILIO_API_KEY_SECRET,
    //   { identity, ttl: 3600 },
    // );
    const token = new AccessToken(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_API_KEY_SID,
      process.env.TWILIO_API_KEY_SECRET,
      { identity, ttl: 3600 },
    );

    const videoGrant = new VideoGrant({ room: roomName });
    token.addGrant(videoGrant);

    return { token: token.toJwt() };
  }

  // New: Fetch completed recordings from Twilio
  async getCompletedRecordings() {
    const recordings = await this.twilioClient.video.v1.recordings.list({
      status: 'completed',
      limit: 20, // or however many you want to fetch
    });
    return recordings;
  }

async endCallAndStoreRecording(consultationId: string) {
  const consultation = await this.consultationModel.findOne({
    where: { consultation_id: consultationId },
  });

  if (!consultation) {
    throw new NotFoundException('Consultation not found');
  }

  const roomSid = consultation.meet_link;


  const room = await this.twilioClient.video.v1.rooms(roomSid).fetch();
  console.log('📡 Room status before completion:', room.status);


  if (room.status !== 'completed') {
    console.log('🛑 Room not completed yet. Completing it now...');
    await this.twilioClient.video.v1.rooms(roomSid).update({ status: 'completed' });
    console.log('✅ Room marked as completed');
  } else {
    console.log('✅ Room already completed');
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  
  console.log("room sid is : " , roomSid)
  const recordings = await this.twilioClient.video.v1.recordings.list({
    groupingSid: [roomSid],
    limit: 5,
  });

  const participantMap = new Map<string, string>(); // Maps participantSid -> identity
  const categorizedUrls = {
    doctor_audio: null,
    doctor_video: null,
    driver_audio: null,
    driver_video: null,
  };

  for (const rec of recordings) {
    // const { participantSid, type: recordingType } = rec;

    console.log("rec is" , rec)
    
    const { sid, type: recordingType } = rec;
    const participantSid = (rec as any).groupingSids?.participant_sid;

    if (!participantSid) {
      console.warn(`Skipping recording ${sid} — missing participantSid`);
      continue;
    }


    // 🔍 Fetch identity from participantSid (if not cached)
    let identity = participantMap.get(participantSid);
    if (!identity) {
      const participant = await this.twilioClient.video.v1.rooms(roomSid)
        .participants(participantSid)
        .fetch();
      identity = participant.identity;
      participantMap.set(participantSid, identity);
    }

    const role = identity?.startsWith('doctor') ? 'doctor' : identity?.startsWith('driver') ? 'driver' : null;
    if (!role) continue;

    // 🧲 Get media redirect URL
    const mediaResponse = await this.twilioClient.request({
      method: 'get',
      uri: `https://video.twilio.com/v1/Recordings/${rec.sid}/Media`,
    });

    const mediaUrl = mediaResponse.body.redirect_to;

    if (!mediaUrl || !mediaUrl.startsWith('http')) {
      console.error(`❌ Invalid media URL for recording ${sid}:`, mediaUrl);
      continue;
    }


    // 🔽 Create axios stream
    const axiosResponse = await axios({
      method: 'GET',
      url: mediaUrl,
      responseType: 'stream',
    });

    const fileExtension = recordingType === 'audio' ? 'm4a' : 'mp4';
    const s3Key = `recordings/${uuidv4()}.${fileExtension}`;

    // ⬆️ Upload to S3 using existing utility
    const s3Url = await uploadStreamToS3(axiosResponse.data, s3Key, recordingType === 'audio' ? 'audio/m4a' : 'video/mp4');

    // 📝 Save in categorized map
    if (role === 'doctor' && recordingType === 'audio') categorizedUrls.doctor_audio = s3Url;
    if (role === 'doctor' && recordingType === 'video') categorizedUrls.doctor_video = s3Url;
    if (role === 'driver' && recordingType === 'audio') categorizedUrls.driver_audio = s3Url;
    if (role === 'driver' && recordingType === 'video') categorizedUrls.driver_video = s3Url;
  }

  // 💾 Update database

    await this.recordingModel.create({
      id: uuidv4(),
      consultation_id: consultationId,
      doctor_audio : categorizedUrls.doctor_audio ,
      doctor_video : categorizedUrls.doctor_video,
      driver_audio: categorizedUrls.driver_audio,
      driver_video: categorizedUrls.driver_video,
    });
  // await consultation.update(categorizedUrls);

  return { message: 'Call ended and recordings saved', ...categorizedUrls };
}

async getRoomStatus(roomSid: string): Promise<string> {
  console.log("room sid in service of getRoomStatus" , roomSid)
  try {
    const room = await this.twilioClient.video.v1.rooms(roomSid).fetch();
    return room.status;
  } catch (error) {
    console.error(`Error fetching room status for SID ${roomSid}:`, error.message);

    if (error.code === 20404) {
      // Twilio specific code for "Resource not found"
      throw new NotFoundException(`Room with SID ${roomSid} not found.`);
    }

    throw new InternalServerErrorException('Failed to fetch room status from Twilio.');
  }
}

  // consultationRecording.service.ts
  async createTwilioRoomForConsultation(
    consultationId: string,
    roomName: string,
    driverContact: string,
  ) {
    try {
      // 1. Create Twilio room
      const room = await this.twilioClient.video.v1.rooms.create({
        uniqueName: roomName,
        type: 'group',
        recordParticipantsOnConnect: true,
        recordingMode: 'composed',
        videoCodecs: ['VP8'],
        unusedRoomTimeout: 60,
      } as any); // <-- Force cast here

      console.log('Twilio room created:', room.sid);

      // 2. Update meet_link in your DB
      await this.consultationModel.update(
        { meet_link: room.sid }, // <-- fields to update
        { where: { consultation_id: consultationId } },
      );


      console.log("notification is calling")
      console.log("driver number is " , driverContact)

       if (driverContact) {
                await this.notificationsService.create({
                  phone_number: driverContact,
                  title: 'Consultation Started',
                  message: 'Doctor has joined the call',
                  priority: NotificationPriority.TYPE1,
                });
              }

         console.log("notification is called")


      return {
        message: 'Room created and meet_link updated successfully.',
        room_sid: room.sid,
        room_name: room.uniqueName,
      };
    } catch (error) {
      console.error('Failed to create room:', error);
      throw new InternalServerErrorException('Failed to create Twilio room');
    }
  }
}
