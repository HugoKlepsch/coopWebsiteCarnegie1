
import * as express from 'express';
import * as staticServe from 'serve-static';
import * as URL from 'url';

import * as logger from './logger';
import { conf } from './config';

export const server: express.Express = express();

server.use('/', (req: express.Request, res: express.Response): void => {
    const url: URL.Url = URL.parse(req.originalUrl);

    logger.log(logger.Level.INFO, {
        http_method:req.method,
        uri_path: url.path,
        src_ip: req.connection.remoteAddress,
        response_code: res.statusCode
    });
});

server.use('/blog', staticServe(conf.get('assetsDir')));

