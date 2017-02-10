import { ApiError } from '../common';

export class RouterUtils {
  static checkTenantID(req, res, next): any {
    if (req.headers['tenant-id']) {
      next();
    } else {
      res.statusCode = 400;
      res.json(new ApiError('Missing Tenant-ID header', 400, 'BAD_REQUEST'));
    }
  }

  static checkEndpointID(req, res, next): any {
    if (req.headers['endpoint-id']) {
      next();
    } else {
      res.statusCode = 400;
      res.json(new ApiError('Missing Endpoint-ID header', 400, 'BAD_REQUEST'));
    }
  }
}