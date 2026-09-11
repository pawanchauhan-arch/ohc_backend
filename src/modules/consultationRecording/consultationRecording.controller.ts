import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  Delete,
  NotFoundException,
  Query,
} from '@nestjs/common';
import { ConsultationRecordingService } from './consultationRecording.service';
import { ConsultationRecording } from 'src/models/consultationRecording';

@Controller('api/consultation-recordings')
export class ConsultationRecordingController {
  constructor(
    private readonly recordingService: ConsultationRecordingService,
  ) {}

  @Post()
  async createRecording(@Body() data: Partial<ConsultationRecording>) {
    return this.recordingService.createRecording(data);
  }

  @Get(':id')
  async getRecordingById(@Param('id') id: string) {
    return this.recordingService.getRecordingById(id);
  }

  @Get('consultation/:consultationId')
  async getRecordingsByConsultationId(
    @Param('consultationId') consultationId: string,
  ) {
    return this.recordingService.getRecordingsByConsultationId(consultationId);
  }

  @Put(':id')
  async updateRecording(
    @Param('id') id: string,
    @Body() data: Partial<ConsultationRecording>,
  ) {
    return this.recordingService.updateRecording(id, data);
  }

  @Delete(':id')
  async deleteRecording(@Param('id') id: string) {
    return this.recordingService.deleteRecording(id);
  }

  // New: Create Twilio Video Room
  @Post('create-video-room')
  async createVideoRoom(@Body() body: { roomName: string }) {
    return this.recordingService.createVideoRoom(body.roomName);
  }

  // New: Generate Twilio Access Token
  @Post('generate-token')
  async generateToken(@Body() body: { identity: string; roomName: string }) {
    return this.recordingService.generateAccessToken(
      body.identity,
      body.roomName,
    );
  }

  @Get('completed-recordings')
  async getCompletedRecordings() {
    return this.recordingService.getCompletedRecordings();
  }



  // POST /consultation-recording/:id/end-call
  @Post(':id/end-call')
  async endConsultationCall(@Param('id') consultationId: string) {
    return this.recordingService.endCallAndStoreRecording(consultationId);
  }


  @Get('room-status/:roomSid')
async getRoomStatus(@Param('roomSid') roomSid: string): Promise<{ status: string }> {
  console.log("roomSid in getRoomStatus: " , roomSid )
  const status = await this.recordingService.getRoomStatus(roomSid);
  return { status };
}

  // consultationRecording.controller.ts
  @Post('create-room')
  async createTwilioRoom(
    @Body('consultation_id') consultationId: string,
    @Body('room_name') roomName: string,
    @Body('driver_contact') driverContact: string,
  ) {
    return this.recordingService.createTwilioRoomForConsultation(
      consultationId,
      roomName,
      driverContact
    );
  }
}
