import { Logger } from '@angular-devkit/core/src/logger';

let mainLogger: Logger
export function setLogger(l: Logger) {
    if(mainLogger != null) {
        // logger already set - don't overwrite
        return;
    }
    mainLogger = l;
}

export function getLogger(name: string): Logger {
    if(mainLogger == null) {
        setLogger(new Logger('just a logger'));
    }
    return mainLogger.createChild(name);
}
