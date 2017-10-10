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
    logLevel: {
        doc: 'The log level mask. Masks log messages of a lower priority. 0 = no logs',
        format: 'int',
        default: 5,
        env: 'LOG_LEVEL'
    },
    port: {
        doc: 'The port to listen on',
        format: 'port',
        default: 8080,
        env: 'PORT'
    }
});

conf.validate();
