import { createHash, createHmac } from 'crypto';

export interface ParkflowSignatureInput {
  readonly method: string;
  readonly requestPathWithQuery: string;
  readonly timestamp: string;
  readonly body: string;
  readonly clientSecret: string;
}

export interface ParkflowSignatureOutput {
  readonly bodyHash: string;
  readonly stringToSign: string;
  readonly signature: string;
}

export function buildParkflowHmacSignature(
  input: ParkflowSignatureInput,
): ParkflowSignatureOutput {
  const bodyHash: string = createHash('sha256').update(input.body).digest('hex');
  const stringToSign: string = [
    input.method.toUpperCase(),
    input.requestPathWithQuery,
    input.timestamp,
    bodyHash,
  ].join('\n');
  const signature: string = createHmac('sha256', input.clientSecret)
    .update(stringToSign)
    .digest('hex');
  return { bodyHash, stringToSign, signature };
}
