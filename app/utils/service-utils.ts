import { Logger, LoggerFactory, InternalError, Request } from '../common';
import { APP_CONFIG } from '../config';
import http = require('http');


export class ServiceUtils {
  private static LOGGER: Logger = LoggerFactory.getLogger();
  
  static sendRequest(requestOptions: Request, requestBody?: any) {
    if (requestBody) {
      requestBody = JSON.stringify(requestBody);
      requestOptions.headers['Content-Length'] = Buffer.byteLength(requestBody).toString();
    }
    
    return new Promise((resolve, reject) => {
      let responseBody: string = '';
      const newRequest = http.request(requestOptions, res => {
        res.setEncoding('utf8');
        res.on('data', chunk => {
          responseBody += chunk;
        });

        res.on('end', () => {
          res['body'] = responseBody;
          return resolve(res);
        });
      });
      
      newRequest.on('error', requestError => {
        ServiceUtils.LOGGER.error(`Request error - ${JSON.stringify(requestError)}`);
        return reject(new InternalError(requestError));
      });

      if (requestBody) {
        newRequest.write(requestBody);
      }

      newRequest.end();
    });
  }
}