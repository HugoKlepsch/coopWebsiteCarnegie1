import * as Express from 'express';

import { conf } from './config';
import * as logger from './logger';
import { server as app } from './server';

app.listen(conf.get('port'), () => {
    logger.log(logger.Level.INFO, {
        message: 'Server startup',
        port: conf.get('port'),
        logLevel: conf.get('logLevel'),
        doCaching: conf.get('doCaching')
    });
});

process.on('exit', () => {
    logger.log(logger.Level.INFO, {message: 'Server shutdown'});
});

process.on('SIGINT', () => {
    process.exit();
});
