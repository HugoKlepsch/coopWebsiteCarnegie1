import * as express from 'express';
import * as fs from 'fs';
import * as statusCodes from 'http-status-codes';
import * as mime from 'mime-types';
import * as Mustache from 'mustache';
import * as nodeYaml from 'node-yaml';
import * as path from 'path';
import * as URL from 'url';

import { cacheClient } from './cache';
import { conf } from './config';
import * as logger from './logger';

export interface IHttpRequest extends express.Request {
    filePermission?: boolean;
    sendType?: 'blog'|'file';
    filePath?: string;
    urlPath?: string;
}

export interface IPhotoInsert {
    filePath: string;
    paragraphIndex; number;
    style: string;
}

export interface IBlogValues {
    blogTitle: string;
    post: string;
    postParagraphs: string[];
    photoInserts: IPhotoInsert[];
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

const doCaching: boolean = conf.get('doCaching');

// Redirector middleware
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    req.urlPath = URL.parse(req.originalUrl).path;

    logger.log(logger.Level.DEBUG, {
        message: 'In base redirector',
        urlPath: req.urlPath
    });

    if (req.urlPath === '/') {
        logger.log(logger.Level.INFO, {
            message: 'Redirecting to index.html',
            urlPath: req.urlPath
        });
        res.redirect('index.html');
        return;
    }

    next();
});

// Cache middleware
// We don't have to verify permissions or render because the permissions were already
// computed to set the cache.
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    // TODO
    if (doCaching) {
        cacheClient.get(name, (err: Error, cacheResponse: string) => {
            if (cacheResponse !== null) {
                // Return cached result
                // TODO
                return; // Don't let the rest of the middlewares run
            } else {
                // Not cached, continue
                next();
            }

            // TODO this doesn't go here, just an example of what it should look like
            // Once we get the age from the database, store it in the cache.
            cacheClient.set(req.urlPath, cacheResponse, () => {

                // At this point, our data is successfully stored in the redis cache
                // We now return the age through the callback
                // cb(getTheVariable)
            });
        });
    }

    next();
});

// Verify permissions and get serve type middleware
// sendType can be either a normal file (file) or a blog post (blog)
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {
    logger.log(logger.Level.DEBUG, {
        message: 'In middleware before server.get'
    });

    // Safe defaults
    req.filePermission = false;
    req.sendType = 'file';

    const filePath: string = path.join(__dirname + '/serverAssets/', req.urlPath);
    req.filePath = filePath;

    if (verifyFilePermission(filePath, allowedDirs)) {
        req.filePermission = true;
        req.filePath = filePath;

        logger.log(logger.Level.DEBUG, {
            message: 'File failed permissions check',
            filePath
        });

    } else {
        req.filePermission = false;

        logger.log(logger.Level.DEBUG, {
            message: 'File passed permissions check',
            filePath
        });

        // We will send the user a 'forbidden' message in the send middleware
        next();
    }

    // If the file path ends in .blogml:
    //  - look for the file in serverAssets/blog/, if exists:
    //      - Render it, wrap it in the default blog skin and send it, skipping later handlers
    // Otherwise, serve the file statically
    const blogFileRegex: RegExp = new RegExp('^.+[.]blogml$');
    if (req.urlPath.match(blogFileRegex)) {
        // It's a blog file, render and then send
        req.sendType = 'blog';
    } else {
        req.sendType = 'file';
    }

    next();
});

// Serve files or render
// This is the only middleware that sends responses to the user.
server.get('/*', (req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {

    // If we're not rendering a blog post, just send the requested file
    if (req.filePermission !== undefined &&
        req.sendType !== undefined &&
        req.filePath !== undefined) {

        if (!req.filePermission) {
            logger.log(logger.Level.DEBUG, {
                message: 'In serve files or render, sending forbidden'
            });
            sendForbidden(res);
            next();
        }

        logger.log(logger.Level.DEBUG, {
            message: 'In server.get',
            sendType: req.sendType
        });

        if (req.sendType === 'blog') {
            // Render and send blog
            // TODO
            const rendered: string = renderBlogPost(req.filePath);
            res.type('text/html').send(rendered);
        } else if (req.sendType === 'file') {
            // Send the file
            sendFile(req.filePath, res);
        } else {
            sendInternalServerError(res);
            logger.log(logger.Level.ERROR, {
                message: 'req.sendType not valid',
                sendType: req.sendType
            });
        }
    } else {
        sendInternalServerError(res);
        logger.log(logger.Level.ERROR, {
            message: 'req undefined',
            sendType: req.sendType,
            filePermission: req.filePermission,
            filePath: req.filePath
        });
    }

    next();
});

// Logging middleware, should be added at the end so that it captures any response_codes set by
// previous middlewares/handlers.
server.use((req: IHttpRequest, res: express.Response, next: express.NextFunction): void => {

    logger.log(logger.Level.INFO, {
        http_method: req.method,
        sendType: req.sendType,
        uri_path: req.urlPath,
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
        logger.log(logger.Level.DEBUG, {
            allowedPath: allowedSegments,
            testPath: pathSegments
        }); // TODO examine paths

        // There's no way it can be a member or descendant if it's not as long
        if (pathSegments.length <= allowedSegments.length) {
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

// sendFile
// TODO return buffer instead of sending here
// TODO make async
function sendFile(filename: string, res: express.Response): void {
    const text: Buffer = fs.readFileSync(filename, { flag: 'r' });

    const contentType = getFileMIME(filename);
    res.type(contentType).send(text);
}

// TODO async, docs,
function renderBlogPost(filename: string): string {
    const templateText: Buffer = fs.readFileSync(conf.get('templateDir') + 'blogml.template', {flag: 'r' });
    const values: IBlogValues = nodeYaml.parse(fs.readFileSync(filename, { flag: 'r' }).toString());

    values.post = '';
    let paragraphIndex: number = 0;
    values.photoInserts.sort((a: IPhotoInsert, b: IPhotoInsert): number => {
        return b.paragraphIndex - a.paragraphIndex; // Sort backwards so pop() returns the first
    });

    values.postParagraphs.forEach((paragraph: string) => {
        let breakFirstImage: boolean = false;

        let i: number = 0;
        while (i < values.photoInserts.length) {
            const photoInsert: IPhotoInsert = values.photoInserts[i];

            if (photoInsert.paragraphIndex <= paragraphIndex) {
                if (!breakFirstImage) {
                    values.post += '<br>';
                    breakFirstImage = true;
                }

                values.post += Mustache.render(
                    '<img class="img" src="{{{filePath}}}" style="{{{style}}}">',
                    photoInsert);
                values.photoInserts.splice(i, 1);
                i -= 1;
            }
            i += 1;
        }

        if (breakFirstImage) {
            values.post += '<br>';
        }

        values.post += '<p>' + paragraph + '</p>\n\n';

        paragraphIndex += 1;
    });
    return Mustache.render(templateText.toString(), values);
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
