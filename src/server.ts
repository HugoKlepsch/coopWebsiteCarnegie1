import * as express from 'express';
import * as fs from 'fs';
import * as statusCodes from 'http-status-codes';
import * as path from 'path';
import * as URL from 'url';

import { conf } from './config';
import * as logger from './logger';

export interface IHttpRequest extends express.Request {
    isRenderingBlog?: boolean;
}

export const server: express.Express = express();

const staticDir = conf.get('assetsDir');

logger.log(logger.Level.INFO, {
    assetsDir: staticDir
});

// Redirect to blog renderer middleware
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    logger.log(logger.Level.DEBUG, {
        message: 'In middleware before server.get'
    });

    // If the file path ends in .blogml:
    //  - look for the file in serverAssets/blog/, if exists:
    //      - Render it, wrap it in the default blog skin and send it, skipping later handlers
    // Otherwise, serve the file statically
    const url: URL.Url = URL.parse(req.originalUrl);
    const blogFileRegex: RegExp = new RegExp('^.+[.]blogml$');
    logger.log(logger.Level.DEBUG, {
        path: url.path
    });
    if (url.path.match(blogFileRegex)) {
        // It's a blog file, render and then send
        logger.log(logger.Level.DEBUG, {
            message: 'Requested a blog file, rendering...'
        });
        req.isRenderingBlog = true;
        res.send('(blog post here)');
    } else {
        req.isRenderingBlog = false;
    }

    next();
});

// Serve files
server.get('/*', (req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    logger.log(logger.Level.DEBUG, {
        message: 'In server.get'
    });

    // If we're not rendering a blog post, just send the requested file
    if (req.isRenderingBlog !== undefined) {
        logger.log(logger.Level.DEBUG, {
            isRenderingBlog: req.isRenderingBlog
        });

        if (!req.isRenderingBlog) {
            // Send the file
            res.send('hello world! :)');
        }
    } else {
        // Something went wrong..
        res.sendStatus(statusCodes.INTERNAL_SERVER_ERROR);
    }

    next();
});

// Logging middleware, should be added at the end so that it captures any response_codes set by
// previous middlewares/handlers.
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    const url: URL.Url = URL.parse(req.originalUrl);

    logger.log(logger.Level.INFO, {
        http_method: req.method,
        uri_path: url.path,
        src_ip: req.connection.remoteAddress,
        response_code: res.statusCode
    });

    next();
});
