import winston = require('winston');
import fs = require('fs');
import morgan = require('morgan');
import { LoggerInstance } from 'winston';
import { StreamOptions } from 'morgan';

export class LoggerFactory {
    private static logger: LoggerInstance;
    public static stream: StreamOptions;

    private static customColors = {
        trace: 'white',
        debug: 'grey',
        info: 'green',
        warn: 'yellow',
        crit: 'red',
        fatal: 'red'
    };

    constructor() {}

  
    static getLogger(): LoggerInstance {
        if (!fs.existsSync('./logs')) {
            fs.mkdir('./logs');
        }

        const loggerOptions: any = {
            write: message => {
                LoggerFactory.logger.info(message);
            }
        };

        if (!LoggerFactory.logger) {
            const logLevel = process.env.LOG_LEVEL;
            LoggerFactory.logger = new winston.Logger({
                colors: LoggerFactory.customColors,
                transports: [
                    new (winston.transports.Console)({
                        level: logLevel,
                        json: false,
                        // handleExceptions: true,
                        humanReadableException: true,
                        timestamp: true,
                        colorize: true
                    }),
                    new (winston.transports.File) ({
                        filename: 'logs/aurora.log',
                        json: true,
                        maxSize: 1000,
                        maxFiles: 5,
                        level: logLevel
                    })
                ]
            });
        }


        LoggerFactory.logger.stream = loggerOptions;
        LoggerFactory.stream = loggerOptions;
        winston.addColors(LoggerFactory.customColors);
        return LoggerFactory.logger;
    }
}

export { LoggerInstance as Logger };