import * as redis from 'redis';

import { conf } from './config';
import * as logger from './logger';

export let cacheClient: redis.RedisClient;

if (conf.get('doCaching')) {
    cacheClient = redis.createClient(conf.get('redisPort'), conf.get('redisHost'));

    cacheClient.on('error', (err: Error) => {
        logger.log(logger.Level.ERROR, {
            message: 'Redis error',
            err
        });
    });
}
