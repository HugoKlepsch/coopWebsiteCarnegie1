import * as express from 'express';
import * as fs from 'fs';
import * as statusCodes from 'http-status-codes';
import * as mime from 'mime-types';
import * as path from 'path';
import * as URL from 'url';

import { conf } from './config';
import * as logger from './logger';

export interface IHttpRequest extends express.Request {
    filePermission?: boolean;
    sendType?: 'blog'|'file';
    filePath: string;
}

export const server: express.Express = express();

const assetsDir = conf.get('assetsDir');

const allowedDirs: string[] = [
    '/server/serverAssets/',
    '/server/bootstrap/',
    path.join(__dirname + '/serverAssets/')
];

logger.log(logger.Level.INFO, {
    assetsDir
});

// Verify permissions and get serve type middleware
// sendType can be either a normal file (file) or a blog post (blog)
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    logger.log(logger.Level.DEBUG, {
        message: 'In middleware before server.get'
    });
    const url: URL.Url = URL.parse(req.originalUrl);

    // Safe defaults
    req.filePermission = false;
    req.sendType = 'file';

    const filePath: string = path.join(__dirname + '/serverAssets/', url.path);
    logger.log(logger.Level.DEBUG, {
        filePath
    });

    if (verifyFilePermission(filePath, allowedDirs)) {
        req.filePermission = true;
        req.filePath = filePath;
    } else {
        req.filePermission = false;
        // We will send the user a 'forbidden' message in the send middleware
        next();
    }

    // If the file path ends in .blogml:
    //  - look for the file in serverAssets/blog/, if exists:
    //      - Render it, wrap it in the default blog skin and send it, skipping later handlers
    // Otherwise, serve the file statically
    const blogFileRegex: RegExp = new RegExp('^.+[.]blogml$');
    logger.log(logger.Level.DEBUG, {
        path: url.path
    });
    if (url.path.match(blogFileRegex)) {
        // It's a blog file, render and then send
        logger.log(logger.Level.DEBUG, {
            message: 'Requested a blog file'
        });
        req.sendType = 'blog';
    } else {
        req.sendType = 'file';
    }

    next();
});

// Serve files or render
// This is the only middleware that sends responses to the user.
server.get('/*', (req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    logger.log(logger.Level.DEBUG, {
        message: 'In server.get'
    });

    // If we're not rendering a blog post, just send the requested file
    if (req.filePermission !== undefined &&
        req.sendType !== undefined &&
        req.filePath !== undefined) {

        if (!req.filePermission) {
            logger.log(logger.Level.DEBUG, {
                message: 'In server.get, sending forbidden'
            });
            sendForbidden(res);
            next();
        }

        logger.log(logger.Level.DEBUG, {
            sendType: req.sendType
        });

        if (req.sendType === 'blog') {
            // Render and send blog
            // TODO
            res.send('This is a blog post');
        } else if (req.sendType === 'file') {
            // Send the file
            sendFile(req.filePath, res);
        } else {
            sendInternalServerError(res);
        }
    } else {
        sendInternalServerError(res);
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
        response_code: res.statusCode,
        contentType: res.get('Content-Type')
    });

    next();
});

// verifyFilePermission
// Given a file path, verify that it's final destination is a member or descendant of a path
// the server has permission to send. This *should not* replace proper unix permissions.
// IN:
//  filePath: string - The path to verify
//  allowedPaths: string[] - A list of allowed directories
// OUT: true if the file is allowed to be sent
function verifyFilePermission(filePath: string, allowedPaths: string[]): boolean {
    // The given path may contain '..', which could 'back it out' of a safe path
    // This is a cannonical, absolute path. (no '..' or '.' and relative to /)
    const pathSegments: string[] = path.resolve(filePath).split(path.sep);

    // As long as the path is a member or a descendant of one of the allowedPaths, it is safe.
    return allowedPaths.some((allowedPath: string) => {
        const allowedSegments: string[] = path.resolve(allowedPath).split(path.sep);

        // There's no way it can be a member or descendant if it's not as long
        if (pathSegments.length < allowedSegments.length) {
            return false;
        }

        for (let i = 0; i < allowedSegments.length; ++i) {
            // Ensure each segment matches
            if (pathSegments[i] !== allowedSegments[i]) {
                return false;
            }
        }
        return true;
    });
}

// sendFileNotFound
// 403
// Sends a pretty html page indicating you don't have permissions to access the page.
function sendForbidden(res: express.Response): void {
    // TODO send a pretty html 404 page
    res.sendStatus(statusCodes.NOT_FOUND);
}

// sendFileNotFound
// 404
// Sends a pretty html page with file not found error.
function sendFileNotFound(res: express.Response): void {
    // TODO send a pretty html 404 page
    res.sendStatus(statusCodes.NOT_FOUND);
}

// sendFileNotFound
// 500
// Sends a pretty html page with internal server error, and offer for communications for breaking
// the site.
function sendInternalServerError(res: express.Response): void {
    // TODO send a pretty html 500 page, "you broke my site, I'd love to hear how"
    res.sendStatus(statusCodes.INTERNAL_SERVER_ERROR);
}

function sendFile(filename: string, res: express.Response): void {
    logger.log(logger.Level.INFO, {
        message: 'Requesting file',
        filePath: filename
    });
    const text: string = fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' });

    const contentType = getFileMIME(filename);
    logger.log(logger.Level.INFO, {
        contentType
    });
    res.type(contentType).send(text);
}

function getFileMIME(filename: string): string {
    let mimeType: string = 'text/html';

    const lookupVal: string | boolean = mime.lookup(path.extname(filename));

    if (typeof lookupVal === 'string') {
        mimeType = lookupVal;
    } else if (typeof lookupVal === 'boolean') {
        mimeType = 'text/html';
    } else {
        mimeType = 'text/html';
    }

    return mimeType;
}
