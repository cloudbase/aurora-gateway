import 'core-js/library';
import { Logger, LoggerFactory, RestErrorMiddleware } from './common';
import { Express, Router } from 'express';
import { ExpressAppFactory } from './express-app-factory';
import { ApiRouterFactory } from './api';
import http = require('http');
import util = require('util');
import { EventEmitter } from './common';
import { ServiceUtils } from './utils';
require('dotenv').config();

const LOGGER: Logger = LoggerFactory.getLogger();
const apiRouter: Router = ApiRouterFactory.getApiRouter();

// Get the application middleware (to be mounted after the api router)
const errorMiddleware = [
  RestErrorMiddleware.normalizeToRestError,
  RestErrorMiddleware.serializeRestError
];

const app: Express = ExpressAppFactory.getExpressApp(apiRouter, null, errorMiddleware);

// Register new instantiated service
ServiceUtils.registerService();

app.listen(parseInt(process.env.PORT), () => {
  LOGGER.info(`Express server listening on port ${process.env.PORT}.`);
});
