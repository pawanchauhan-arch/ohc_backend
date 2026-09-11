import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GovPatientPushService } from './latehar-sync.service';
import { singletonJobsEnabled } from 'config/envConfig';

@Injectable()
export class LateharSyncCron {
  private readonly logger = new Logger(LateharSyncCron.name);

  constructor(private readonly service: GovPatientPushService) {}
  private driverRunning = false;
  private requestRunning = false;
  private consultationRunning = false;
  /**
   * DRIVER SYNC
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async syncDrivers() {
    if (!singletonJobsEnabled) {
      this.logger.log('RUN_SINGLETON_JOBS is disabled; skipping driver sync cron on this server');
      return;
    }
    if (this.driverRunning) {
      this.logger.warn('Driver Sync already running, skipping...');
      return;
    }
    this.driverRunning = true;
    const start = Date.now();

    this.logger.log('Driver Sync Cron Started');

    try {
      const centerIds = await this.service.getCentersFromGroup(1);

      if (!centerIds.length) {
        this.logger.warn('No centers found in group 1');
        return;
      }

      const pending = await this.service.getPendingDrivers(centerIds);

      if (!pending.length) {
        this.logger.log('No driver records to sync');
        return;
      }

      for (const row of pending) {
        try {
          await this.service.pushDriver(row);
        } catch (e) {
          this.logger.error(`Driver push failed `, e);
        }
      }

      this.logger.log(
        `Driver Sync Completed: ${pending.length} records in ${(Date.now() - start) / 1000}s`,
      );
    } catch (err) {
      this.logger.error('Driver Sync Error:', err);
    } finally {
      this.driverRunning = false;
    }
  }

  /**
   * REQUEST SYNC
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async syncRequest() {
    if (!singletonJobsEnabled) {
      this.logger.log('RUN_SINGLETON_JOBS is disabled; skipping request sync cron on this server');
      return;
    }
    if (this.requestRunning) {
      this.logger.warn('Request Sync already running, skipping...');
      return;
    }
    this.requestRunning = true;
    const start = Date.now();
    this.logger.log('Request Sync Cron Started');

    try {
      const centerIds = await this.service.getCentersFromGroup(1);

      if (!centerIds.length) {
        this.logger.warn('No centers found in group 1');
        return;
      }

      const pending = await this.service.getPendingRequest(centerIds);

      if (!pending.length) {
        this.logger.log('No request records to  sync');
        return;
      }

      for (const row of pending) {
        try {
          await this.service.pushRequest(row);
        } catch (e) {
          this.logger.error(`Request push failed`, e);
        }
      }
      this.logger.log(
        `Request Sync Completed: ${pending.length} records in ${(Date.now() - start) / 1000}s`,
      );
    } catch (err) {
      this.logger.error('Request Sync Error:', err);
    } finally {
      this.requestRunning = false;
    }
  }

  /**
   * CONSULTATION SYNC
   */
  @Cron(CronExpression.EVERY_12_HOURS)
  async syncConsultation() {
    if (!singletonJobsEnabled) {
      this.logger.log('RUN_SINGLETON_JOBS is disabled; skipping consultation sync cron on this server');
      return;
    }
    if (this.consultationRunning) {
      this.logger.warn('Consultation Sync already running, skipping...');
      return;
    }
    this.consultationRunning = true;
    const start = Date.now();
    this.logger.log('Consultation Sync Cron Started');

    try {
      const centerIds = await this.service.getCentersFromGroup(1);

      if (!centerIds.length) {
        this.logger.warn('No centers found in group 1');
        return;
      }

      const pending = await this.service.getPendingConsultation(centerIds);

      if (!pending.length) {
        this.logger.log('No consultation records to sync');
        return;
      }

      for (const row of pending) {
        try {
          await this.service.pushConsultation(row);
        } catch (e) {
          this.logger.error(`Consultation push failed `, e);
        }
      }
      this.logger.log(
        `Consultation Sync Completed: ${pending.length} records in ${(Date.now() - start) / 1000}s`,
      );
    } catch (err) {
      this.logger.error('Consultation Sync Error:', err);
    } finally {
      this.consultationRunning = false;
    }
  }
}
