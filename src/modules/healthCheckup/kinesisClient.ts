import { KinesisClient } from "@aws-sdk/client-kinesis";
import { kinesisConfig } from 'config/envConfig';

const kinesisClient = new KinesisClient({
    region: kinesisConfig.region, // e.g., 'ap-south-1'
    credentials: {
        accessKeyId: kinesisConfig.accessKeyId,
        secretAccessKey: kinesisConfig.secretAccessKey
    }
});

const STREAM_NAME: string = kinesisConfig.streamName;

export { kinesisClient, STREAM_NAME };