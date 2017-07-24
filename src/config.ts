
import * as convict from 'convict';
import * as fs from 'fs';

export let conf: convict.Config = convict({
    port: {
        doc: 'The port to listen on',
        format: 'port',
        default: 8080,
        env: 'PORT'
    },
    assetsDir: {
        doc: 'The directory for all assets to be statically served',
        format: (path: string): void => {
            if (!fs.existsSync(path)) {
                throw new Error('ASSETS_DIR must be a valid path');
            }
        },
        default: 'build/serverAssets/',
        env: 'ASSETS_DIR'
    }
});

conf.validate();
