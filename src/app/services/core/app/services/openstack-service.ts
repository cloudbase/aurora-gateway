import http = require('http');
import request = require('request');
import { Logger, LoggerFactory, InternalError, ApiError, EventEmitter } from '../common';
import { ServiceUtils } from '../utils';
import util = require('util');
import url = require('url');

export class OpenstackService {
  
  private static LOGGER: Logger = LoggerFactory.getLogger();

  constructor() {}

  static updateServiceCatalog(newServiceCatalog: Array<{}>) {
    newServiceCatalog.forEach(item => {
      OpenstackService.LOGGER.debug(`Emitting update event for - ${JSON.stringify(item)}`);
      item['endpoints'].forEach(endpoint => {
        // For V2 API Cinder has a separate entry in the Service Catalog with the name "cinderv2"
        item['name'] = item['name'] === 'cinderv2' ? 'cinder' : item['name'];
        EventEmitter.emitUpdateEvent(
          item['name'],
          endpoint
        );
      });
    });
  }
  
  static callOSApi(options: {}, body?: any): Promise<any> {
    const requestOptions = {
      protocol: options.protocol || 'http:',
      host: options.host,
      port: options.port,
      path: options.path,
      method: options.method || 'GET',
      headers: options.headers || {'Content-Type': 'application/json'}
    };
    
    OpenstackService.LOGGER.debug(`Calling OpenStack service with ${JSON.stringify(requestOptions)}`);
    return ServiceUtils.sendRequest(requestOptions, body)
      .then(APIResponse => {
        // OpenstackService.LOGGER.info(`Original OpenStack API Response - ${JSON.stringify(APIResponse.body)}`);
        return OpenstackService.parseApiResponse(APIResponse);
      })
      .then(parsedResponse => {
        OpenstackService.LOGGER.debug(`Parsed OpenStack API Response - ${JSON.stringify(parsedResponse.body)}`);
        return Promise.resolve(parsedResponse);
      })
      .catch(OSRequestError => {
        OpenstackService.LOGGER.error(`Error occurred while trying to call OpenStack API - ${JSON.stringify(OSRequestError)}`);
        return Promise.reject(OSRequestError);
      });
  }

  static parseApiResponse(APIResponse): Promise<any> {
    return new Promise((resolve, reject) => {
      if (APIResponse.statusCode < 200 || APIResponse.statusCode > 299) {
        // In some cases OpenStack APIs return an html in case of error
        let OSApiError = {error: {}};
        try {
          OSApiError = JSON.parse(APIResponse.body);
          if (!OSApiError.error) {
            OSApiError = {
              'error': {
                'message': OSApiError,
                'code': APIResponse.statusCode,
                'title': 'OpenStack API error'
              }
            };
          }
        } catch (e) {
          OSApiError = {
            'error': {
              'message': APIResponse.body,
              'code': APIResponse.statusCode,
              'title': 'Unknown OpenStack API error'
            }
          };
        }
        return reject(new ApiError(OSApiError.error.message, OSApiError.error.code, OSApiError.error.title));
      } else if (parseInt(APIResponse.headers['content-length']) === 0) {
        // In some cases OS API returns an empty body (eg - on nova server actions)
        APIResponse.body = {'info': 'Successful API call'};
        return resolve(APIResponse);
      } else {
        APIResponse.body = JSON.parse(APIResponse.body);
        return resolve(APIResponse);
      }
    });
  }
}

