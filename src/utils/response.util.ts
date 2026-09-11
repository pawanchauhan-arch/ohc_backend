import { HttpStatus } from '@nestjs/common';

export function formatResponse(
  status: boolean,
  code: number,
  data: any = null,
  message = '',
) {
  return {
    status,
    code,
    data,
    message,
  };
}

export function sendSuccess(
  res: any,
  code: number,
  data: any = null,
  message = 'Success',
) {
  return res
    .status(HttpStatus.OK)
    .json(formatResponse(true, code, data, message));
}

export function sendError(
  res: any,
  code: number,
  message: string,
) {
  return res
    .status(code)
    .json(formatResponse(false, code, null, message));
}
