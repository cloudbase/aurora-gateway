import express = require('express');
import { Router } from 'express';
import { IdentityRouter, NovaRouter, PluginRouter, NeutronRouter, GlanceRouter, CinderRouter } from './routes';
import { Logger, LoggerFactory, InvalidResourceUrlError } from '../common';
import { OpenstackService, IdentityService, PluginManager, MonitoringService } from '../services';

export class ApiRouterFactory {

  private static LOGGER: Logger = LoggerFactory.getLogger();

  private constructor() {}

  static getApiRouter(openstackService: OpenstackService): Router {
    const apiRouter: Router = express.Router({ mergeParams: true });

    const identityService = new IdentityService(openstackService.authUrl, openstackService.apiVersion);
    const pluginManager = new PluginManager();
    const monitoringService = new MonitoringService();
    MonitoringService.registerEvents(monitoringService);

    const identityRouter: Router = new IdentityRouter(identityService, openstackService).router;
    const novaRouter: Router = new NovaRouter(openstackService).router;
    const neutronRouter: Router = new NeutronRouter(openstackService).router;
    const cinderRouter: Router = new CinderRouter(openstackService).router;
    const glanceRouter: Router = new GlanceRouter(openstackService).router;
    const pluginRouter: Router = new PluginRouter(pluginManager).router;
    
    ApiRouterFactory.LOGGER.info('Mounting routes');
    apiRouter.use('/identity', identityRouter);
    apiRouter.use('/nova', novaRouter);
    apiRouter.use('/cinder', cinderRouter);
    apiRouter.use('/neutron', neutronRouter);
    apiRouter.use('/glance', glanceRouter);
    apiRouter.use('/plugins', pluginRouter);
    
    apiRouter.all('*', (req, res, next) => {
      next(new InvalidResourceUrlError());
    });

    return apiRouter;
  }
}
