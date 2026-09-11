import { randomUUID } from 'crypto';

export class CorrelationIdMiddleware {
  use(req, res, next) {
    const requestId = randomUUID();

    req.requestId = requestId;

    res.setHeader(
      'X-Request-Id',
      requestId,
    );

    next();
  }
}
