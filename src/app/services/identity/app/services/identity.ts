import { OpenstackService } from './openstack-service';
import { OpenstackAPIModel } from './openstack-api-model';
import { EventEmitter, RabbitClient, Logger, LoggerFactory, NotImplementedError, InternalError } from '../common';
import { AuthenticationUtils } from '../utils';

export class IdentityService extends OpenstackAPIModel {
  private apiHost: string;
  private apiPath: string;
  private apiPort: string;
  private apiVersion: string;
  public ID: string;
  public rabbitClient: RabbitClient;

  constructor(apiHost: string, apiPort: string, apiPath: string, apiVersion: string) {
    super();
    this.name = 'keystone';
    this.type = 'identity';
    this.apiHost = apiHost;
    this.apiPath = apiPath;
    this.apiPort = apiPort;
    this.apiVersion = apiVersion;
    let identityService = this;
    EventEmitter.eventEmitter.on(EventEmitter.UPDATE_SERVICE_ID, (newID) => {
      identityService.ID = newID;
    });
    this.rabbitClient = new RabbitClient('aurora-services');
  }

  authenticate(credentials: {}): Promise<any> {
    let result = {};
    let parsedCredentials = {};
    return AuthenticationUtils.parseCredentials(credentials, this.apiVersion)
      .then((authObj) => {
        parsedCredentials = authObj;
        return this.getToken(authObj);
      })
      .then(response => {
        if (response.body.access.serviceCatalog.length === 0) {
          result = response.body;
          return this.listTenants(response.body.access.token.id);
        } else {
          this.rabbitClient.publishMessage(
            this.rabbitClient.servicesExchange, 'NEW_SERVICE_CATALOG', '', response.body.access.serviceCatalog
          );
          return Promise.resolve(response);
        }
      })
      .then((response) => {
        if (Object.getOwnPropertyNames(result).length !== 0) {
          result = response.body;
          let reqObject = credentials;
          reqObject['tenant'] = response.body.tenants[0].name;
          return this.getServiceCatalog(reqObject);
        } else return Promise.resolve(response);
      })
      .then((response) => {
        if (Object.getOwnPropertyNames(result).length !== 0) {
          response.body['tenants'] = result;
          this.rabbitClient.publishMessage(
            this.rabbitClient.servicesExchange, 'NEW_SERVICE_CATALOG', '', response.body.access.serviceCatalog
          );
          return Promise.resolve(response);
        } else return Promise.resolve(response);
      })
      .catch((error) => {
        return Promise.reject(error);
      });
  }

  destroySession(currentSession: any): Promise<any> {
    return new Promise((resolve, reject) => {
      currentSession.destroy((error) => {
        if (error) {
          return reject(new InternalError(error));
        } else {
          return resolve({
            'status': 'Successfully logged out'
          });
        }
      });
    });
  }

  getToken(credentials: {}): Promise<any> {
    // TODO: Abstract endpoint for different API versions
    OpenstackAPIModel.LOGGER.debug('Requesting token from Keystone');
    return OpenstackService.callOSApi( {
      path: this.apiPath + '/tokens',
      port: this.apiPort,
      host: this.apiHost,
      body: credentials,
      method: 'POST'
    });
  }

  getServiceCatalog(authObj?: {}): Promise<any> {
    if (authObj) {
      if (this.apiVersion === '2.0') {
        return AuthenticationUtils.parseCredentials(authObj, this.apiVersion)
          .then((authBody) => {
            return this.getToken(authBody);
          })
          .then((result) => {
            return Promise.resolve(result);
          });
      } else {
        return Promise.reject(
          new NotImplementedError(`Feature is not available for this OpenStack API version ${this.apiVersion}`)
        );
      }
    }
  }

  listTenants(apiToken: string): Promise<any> {
    OpenstackAPIModel.LOGGER.debug(`Getting tenant list for ${apiToken}`);
    return OpenstackService.callOSApi({
      path: this.apiPath + '/tenants',
      port: this.apiPort,
      host: this.apiHost,
      headers: { 'X-Auth-Token': apiToken }
    });
  }

  listExtensions(): Promise<any> {
    OpenstackAPIModel.LOGGER.debug('Listing extensions');
    return OpenstackService.callOSApi({
      path: this.apiPath + '/extensions',
      port: this.apiPort,
      host: this.apiHost
    });
  }

  listVersions(): Promise<any> {
    OpenstackAPIModel.LOGGER.debug('Listing OpenStack API versions');
    return OpenstackService.callOSApi({
      path: this.apiPath,
      port: this.apiPort,
      host: this.apiHost
    });
  }
}