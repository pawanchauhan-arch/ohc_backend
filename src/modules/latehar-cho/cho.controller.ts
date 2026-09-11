import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { ChoService } from './cho.service';
import { StartDutyDto, EndDutyDto } from './dto/cho-duty.dto';

@Controller('api/cho-duty')
export class ChoController {
    constructor(private readonly choService: ChoService) { }

    @Post('start')
    async startDuty(@Body() dto: StartDutyDto) {
        return this.choService.startDuty(dto);
    }

    @Post('end')
    async endDuty(@Body() dto: EndDutyDto) {
        return this.choService.endDuty(dto);
    }

    @Get('status')
    async getDutyStatus(@Query('cho_id') cho_id: number) {
        return this.choService.getDutyStatus(cho_id);
    }
    @Get('center-logs')
    async getCenterLogs(
        @Query('cho_id') cho_id: number,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.choService.getCenterLogs(cho_id, startDate, endDate);
    }

}
