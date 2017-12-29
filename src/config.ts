import * as convict from 'convict';
import * as fs from 'fs';

export let conf: convict.Config = convict({
    assetsDir: {
        doc: 'The directory for all assets to be statically served',
        format: (path: string): void => {
            if (!fs.existsSync(path)) {
                throw new Error('ASSETS_DIR must be a valid path');
            }
        },
        default: 'build/serverAssets/',
        env: 'ASSETS_DIR'
    },
    templateDir: {
        doc: 'The directory for all template files',
        format: (path: string): void => {
            if (!fs.existsSync(path)) {
                throw new Error('TEMPLATE_DIR must be a valid path');
            }
        },
        default: 'build/renderTemplates/',
        env: 'TEMPLATE_DIR'
    },
    logLevel: {
        doc: 'The log level mask. Masks log messages of a lower priority. 0 = no logs',
        format: 'int',
        default: 5,
        env: 'LOG_LEVEL'
    },
    port: {
        doc: 'The port to listen on',
        format: 'port',
        default: 8081,
        env: 'PORT'
    },
    doCaching: {
        doc: 'True to use redis as cache, false means no caching',
        format: 'Boolean',
        default: false,
        env: 'DO_CACHING'
    },
    redisPort: {
        doc: 'The port for redis to connect to',
        format: 'port',
        default: 6379,
        env: 'REDIS_PORT'
    },
    redisHost: {
        doc: 'The host for redis to connect to',
        format: 'ipaddress',
        default: '127.0.0.1',
        env: 'REDIS_HOST'
    }

});

conf.validate();
