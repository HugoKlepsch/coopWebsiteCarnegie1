
import * as express from 'express';
import * as staticServe from 'serve-static';
import * as responseTime from 'response-time';
import * as URL from 'url';

import * as logger from './logger';
import { conf } from './config';

export const server: express.Express = express();

server.use(responseTime((req: express.Request, res: express.Response, time: number): void => {
    const url: URL.Url = URL.parse(req.originalUrl);

    logger.log(logger.Level.INFO, {
        http_method:req.method,
        uri_path: url.path,
        src_ip: req.connection.remoteAddress,
        response_code: res.statusCode,
        response_time: time
    });

}));

server.use('/blog', staticServe(conf.get('assetsDir')));

server.use('/', express.static(__dirname + '/../www'));
server.use('/js', express.static(__dirname + '/../node_modules/bootstrap/dist/js')); // redirect bootstrap JS
server.use('/css', express.static(__dirname + '/../node_modules/bootstrap/dist/css')); // redirect CSS bootstrap
/*
server.use('/js', express.static(__dirname + '/../themes/startbootstrap-clean-blog-gh-pages/js'));
server.use('/css', express.static(__dirname + '/../themes/startbootstrap-clean-blog-gh-pages/css'));
 */
server.use('/fonts', express.static(__dirname + '/../node_modules/bootstrap/dist/fonts')); // redirect CSS bootstrap
