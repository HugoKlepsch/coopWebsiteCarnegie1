
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as URL from 'url';

import * as logger from './logger';
import { conf } from './config';

/*
export const server: express.Express = express();


var staticDir = conf.get('assetsDir');
logger.log(logger.Level.INFO, {
    assetsDir: staticDir
});
server.use('/blog', express.static(staticDir));

server.use('/', express.static('www'));
server.use('/js', express.static('node_modules/bootstrap/dist/js')); // redirect bootstrap JS
server.use('/js', express.static('node_modules/jquery/dist')); // redirect JS jQuery
server.use('/css', express.static('node_modules/bootstrap/dist/css')); // redirect CSS bootstrap

server.use('/', (req: express.Request, res: express.Response, next: express.NextFunction): void => {
    const url: URL.Url = URL.parse(req.originalUrl);

    logger.log(logger.Level.INFO, {
        http_method:req.method,
        uri_path: url.path,
        src_ip: req.connection.remoteAddress,
        response_code: res.statusCode
    });
    next();
});
 */

export const server: http.Server = http.createServer((request, response) => {

  var uri = URL.parse(request.url).pathname
    , filename = path.join(process.cwd(), uri);

  var contentTypesByExtension = {
    '.html': "text/html",
    '.css':  "text/css",
    '.js':   "text/javascript"
  };

  fs.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

    if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      var headers = {};
      var contentType = contentTypesByExtension[path.extname(filename)];
      if (contentType) headers["Content-Type"] = contentType;
      response.writeHead(200, headers);
      response.write(file, "binary");
      response.end();
    });
  });
});
