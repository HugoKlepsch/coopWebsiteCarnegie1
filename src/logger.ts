import { conf } from './config';

// tslint:disable:no-console

export enum Level {
    NONE = 0,
        FATAL = 1,
        TRACE = 2,
        ERROR = 3,
        WARN = 4,
        INFO = 5,
        DEBUG = 6
}

export function logBasic(message: string): void {
    console.log(message);
}

export function log(level: Level, fields: object): void {
    if (conf.get('logLevel') >= level) {
        const logStr: string = '[' + new Date().toISOString() + '] ';

        const fieldsArray: string[] = [];

        Object.keys(fields).forEach((key: string) => {
            fieldsArray.push(key + '=' + fields[key]);
        });

        console.log(logStr + fieldsArray.join(', '));
    }
}
