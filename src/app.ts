

import * as Express from 'express';

import { server as app } from './server';
import * as logger from './logger';
import { conf } from './config'

app.listen(conf.get('port'), () => {
    logger.log(logger.Level.INFO, {message: 'Server startup', port: conf.get('port')});
});

process.on('exit', () => {
    logger.log(logger.Level.INFO, {message: 'Server shutdown'});
});

process.on('SIGINT', process.exit);

