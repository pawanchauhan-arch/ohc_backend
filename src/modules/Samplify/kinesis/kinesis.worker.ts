import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { KinesisStreamService } from './kinesis.service';
import { CampProcessor } from '../processor/camp.processor';
import { kinesisConfig, singletonJobsEnabled } from 'config/envConfig';
const streamName: string = kinesisConfig.streamName;

interface ShardInfo {
  shardId: string;
  iterator: string | null;
}

@Injectable()
export class KinesisWorker implements OnModuleInit {
  private readonly logger = new Logger(KinesisWorker.name);
  private shards: ShardInfo[] = [];

  constructor(
    private readonly kinesisService: KinesisStreamService,
    private readonly campProcessor: CampProcessor,
  ) {}

  async onModuleInit() {
    if (!singletonJobsEnabled) {
      this.logger.log('RUN_SINGLETON_JOBS is disabled; skipping Kinesis worker initialization on this server');
      return;
    }
    await this.initIterators();
  }

  private async initIterators() {
    try {
      const listResponse = await this.kinesisService.listShards(streamName);

      if (!listResponse.Shards || listResponse.Shards.length === 0) {
        throw new Error('No shards found in stream');
      }

      this.logger.log(`Initializing iterators for ${listResponse.Shards.length} shards`);

      // Parallel init for all shards
      this.shards = await Promise.all(
        listResponse.Shards.map(async (shard) => {
          const shardId = shard.ShardId;
          this.logger.log(`Initializing shard: ${shardId}`);

          const { ShardIterator } = await this.kinesisService.getShardIterator({
            StreamName: streamName,
            ShardId: shardId,
            ShardIteratorType: 'LATEST', // Change to 'TRIM_HORIZON' for backlog testing
          });

          if (!ShardIterator) {
            throw new Error(`Failed to get iterator for ${shardId}`);
          }

          return { shardId, iterator: ShardIterator };
        }),
      );

      this.logger.log('All shard iterators initialized successfully');
    } catch (err) {
      this.logger.error('Failed to initialize shard iterators', err?.stack);
      this.shards = [];
    }
  }

  @Interval(1000)
  async consume() {
    if (!singletonJobsEnabled) {
      return;
    }

    if (this.shards.length === 0) {
      this.logger.warn('No shard iterators available; skipping consumption');
      return;
    }

    // Sequential poll per shard (use Promise.all for true parallel if needed)
    for (const shardInfo of this.shards) {
      if (!shardInfo.iterator) continue;

      try {
        const response = await this.kinesisService.getRecords(shardInfo.iterator);
        shardInfo.iterator = response.NextShardIterator || null;

        if (!response.Records ) {
          this.logger.debug(`No records from shard ${shardInfo.shardId}`);
          continue;
        }

        for (const record of response.Records) {
          try {
            const parsed = JSON.parse(record.Data.toString('utf-8'));
            await this.campProcessor.processCamp(parsed);
            this.logger.debug(`Processed record ${record.SequenceNumber} from shard ${shardInfo.shardId}`);
          } catch (parseErr) {
            this.logger.error(`Failed to parse/process record ${record.SequenceNumber} in shard ${shardInfo.shardId}`, parseErr?.stack);
          }
        }
      } catch (err) {
        this.logger.error(`Failed to consume from shard ${shardInfo.shardId}: ${err.message}`, err?.stack);
        if (err.message?.includes('ExpiredIteratorException') || err.message?.includes('InvalidArgumentException')) {
          this.logger.warn(`Reinitializing iterator for shard ${shardInfo.shardId}`);
          try {
            const { ShardIterator } = await this.kinesisService.getShardIterator({
              StreamName: streamName,
              ShardId: shardInfo.shardId,
              ShardIteratorType: 'LATEST',
            });
            shardInfo.iterator = ShardIterator || null;
          } catch (reinitErr) {
            this.logger.error(`Failed to reinit shard ${shardInfo.shardId}`, reinitErr?.stack);
            shardInfo.iterator = null;
          }
        }
      }
    }
  }
}
