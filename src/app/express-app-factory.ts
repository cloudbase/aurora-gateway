import { Express, Router, RequestHandler, ErrorRequestHandler } from 'express';
import { AppConfig } from './config';
import express = require('express');
import bodyParser = require('body-parser');
import morgan = require('morgan');
import { Logger, LoggerFactory } from './common';
import expressSession = require('express-session');
import cors = require('cors');

export class ExpressAppFactory {

  private static readonly LOGGER: Logger = LoggerFactory.getLogger();

  private constructor() {}

  static getExpressApp(
    appConfig: AppConfig,
    apiRouter: Router,
    preApiRouterMiddlewareFns: Array<RequestHandler | ErrorRequestHandler>,
    postApiRouterMiddlewareFns: Array<RequestHandler | ErrorRequestHandler>): Express {

    const app: Express = express();

    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(expressSession({
      secret: appConfig.sessionSecret,
      maxAge: new Date(Date.now() + 3600000),
      expires: new Date(Date.now() + 3600000),
      saveUninitialized: true
    }));
    app.use(cors());
    
    if (appConfig.serveStatic) {
      ExpressAppFactory.LOGGER.info(`Serving static files from public`);
      app.use(express.static('public'));
    }

    if (appConfig.enableHttpRequestLogging) {
      ExpressAppFactory.LOGGER.info(`Request logging is enabled`);
      app.use(morgan(':remote-addr :user-agent :method :url :status :response-time ms - :res[content-length]',
        {'stream': ExpressAppFactory.LOGGER.stream}) );
    }

    if (preApiRouterMiddlewareFns != null) {
      postApiRouterMiddlewareFns.forEach((middlewareFn) => app.use(middlewareFn));
    }

    app.use('/api', apiRouter);

    if (postApiRouterMiddlewareFns != null) {
      postApiRouterMiddlewareFns.forEach((middlewareFn) => app.use(middlewareFn));
    }

    return app;
  }

}
