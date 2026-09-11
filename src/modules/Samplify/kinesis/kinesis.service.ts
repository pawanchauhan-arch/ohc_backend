import { Injectable, Logger } from '@nestjs/common';
import { Kinesis } from 'aws-sdk';
import type { GetShardIteratorInput } from 'aws-sdk/clients/kinesis';
import { kinesisConfig } from 'config/envConfig';

@Injectable()
export class KinesisStreamService {
  private readonly logger = new Logger(KinesisStreamService.name);
  private kinesis: Kinesis;

  constructor() {
    this.kinesis = new Kinesis({
      region: kinesisConfig.region,
      accessKeyId: kinesisConfig.accessKeyId,
      secretAccessKey: kinesisConfig.secretAccessKey,
      httpOptions: {
        connectTimeout: 5000, // 5 seconds to establish connection
        timeout: 30000,       // 30 seconds for the entire request
      },
      maxRetries: 3, // Retry up to 3 times on failure
    });
  }

  async putRecord(streamName: string, data: any, partitionKey: string) {
    try {
      this.logger.debug(`Putting record to stream: ${streamName}, partitionKey: ${partitionKey}`);
      const result = await this.kinesis
        .putRecord({
          StreamName: streamName,
          PartitionKey: partitionKey,
          Data: Buffer.from(JSON.stringify(data), 'utf8'),
        })
        .promise();
      this.logger.debug(`Successfully put record: ${result.SequenceNumber}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to put record to ${streamName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRecords(shardIterator: string) {
    try {
      // this.logger.debug('Fetching records from shard iterator');
      const result = await this.kinesis.getRecords({ ShardIterator: shardIterator }).promise();
      // this.logger.debug(`Fetched ${result.Records?.length || 0} records`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get records: ${error.message}`, error.stack);
      throw error;
    }
  }

  async listShards(streamName: string) {
    try {
      this.logger.debug(`Listing shards for stream: ${streamName}`);
      const result = await this.kinesis.listShards({ StreamName: streamName }).promise();
      this.logger.debug(`Found ${result.Shards?.length || 0} shards`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to list shards for ${streamName}: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getShardIterator(params: GetShardIteratorInput) {
    try {
      this.logger.debug(`Getting shard iterator for shard: ${params.ShardId}`);
      const result = await this.kinesis.getShardIterator(params).promise();
      this.logger.debug('Shard iterator obtained');
      return result;
    } catch (error) {
      this.logger.error(`Failed to get shard iterator: ${error.message}`, error.stack);
      throw error;
    }
  }
}