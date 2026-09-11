import { Controller, Post, Body, Get, Param, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { DailyVideoService } from './dailyVideo.service';

@Controller('api/daily-video')
export class DailyVideoController {

    private readonly logger = new Logger(DailyVideoController.name);

  constructor(private readonly dailyService: DailyVideoService) {}

  @Post('create-room')
  async createRoom(
    @Body('room_name') roomName: string,
    @Body('scheduled_time') scheduledTime: string
  ) {
    return this.dailyService.createRoom(roomName, scheduledTime);
  }
  

//   @Post('generate-token')
//     async generateToken(@Body('roomName') roomName: string) {
//     return this.dailyService.generateToken(roomName);
// }

@Post('generate-token')
async generateToken(
  @Body('roomName') roomName: string,
  @Body('userName') userName: string,
) {
  // 🧠 Use doctor's ID, worker ID, or "admin" here
  return this.dailyService.generateToken(roomName, userName);
}



@Post('end-consultation')
  async endConsultation(@Body() body: { consultation_id: string; room_name: string }) {
    const { consultation_id, room_name } = body;

    this.logger.log(`Ending consultation: ${consultation_id} in room: ${room_name}`);

    if (!consultation_id || !room_name) {
      throw new HttpException('Missing required fields', HttpStatus.BAD_REQUEST);
    }

    return await this.dailyService.handleEndConsultation(consultation_id, room_name);
  }
  
}
