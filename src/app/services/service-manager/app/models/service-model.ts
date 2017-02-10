export class ServiceModel {
  public host: string;
  public port: string;
  public name: string;
  public status: string;
  public routingPath: string;
  public apiPath: string;
  public lastUpdate: string;
  
  constructor(host: string, port: string, name: string, status: string, routingPath: string, apiPath: string) {
    this.host = host;
    this.port = port;
    this.name = name;
    this.status = status;
    this.routingPath = routingPath;
    this.apiPath = apiPath;
    this.lastUpdate = Date.now();
  }
  
  toJSON() {
    return {
      host: this.host,
      port: this.port,
      apiPath: this.apiPath,
      name: this.name,
      routingPath: this.routingPath
    }
  }
}