
import * as http from 'http';
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as URL from 'url';

import * as logger from './logger';
import { conf } from './config';

export const server: express.Express = express();


var staticDir = conf.get('assetsDir');

logger.log(logger.Level.INFO, {
    assetsDir: staticDir
});

// Logging middleware
server.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const url: URL.Url = URL.parse(req.originalUrl);

    logger.log(logger.Level.INFO, {
        http_method:req.method,
        uri_path: url.path,
        src_ip: req.connection.remoteAddress,
        response_code: res.statusCode,
    });
});

// Redirect to blog renderer middleware
server.use((req: express.Request, res: express.Response, next: express.NextFunction): void => {
    logger.log(logger.Level.INFO, {
        message: 'In middleware before server.get'
    });

    // If the file path ends in .blogml:
    //  - look for the file in serverAssets/blog/, if exists:
    //      - Render it, wrap it in the default blog skin and send it, skipping later handlers
    // Otherwise, serve the file statically

    next();
});

// Serve files
server.get('/*', (req: express.Request, res: express.Response, next: express.NextFunction): void => {

    res.send('hello world! :)');
});
