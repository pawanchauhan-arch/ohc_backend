import { Controller, Get } from '@nestjs/common';
import { GovPatientPushService } from './latehar-sync.service';

@Controller('latehar-sync')
export class LateharSyncController {
    constructor(private readonly service: GovPatientPushService) { }
    // @Get('run')
    // async runSync() {
    //     const pending = await this.service.getPendingDrivers();

    //     const results = [];
    //     for (const row of pending) {
    //         const res = await this.service.pushDriver(row);
    //         results.push(res);
    //     }

    //     return { count: results.length, results };
    // }
}
