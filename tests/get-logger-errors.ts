import { LogEntry, Logger, LogLevel } from '@angular-devkit/core/src/logger';
import { isObservable, Observable } from 'rxjs';
import { filter, map, take, takeUntil } from 'rxjs/operators';

type LogProjector<T> = (e: LogEntry) => T;
const defaultProjection: LogProjector<string> = e => e?.message;

export function listenLogger<T = string>(l: Logger, options?: {
    level?: LogLevel,
    project?: LogProjector<T>
}): Observable<T | string> {
    const level = typeof options?.level === 'string' ? options.level : 'error';
    const project: LogProjector<T | string> = typeof options?.project === 'function'
        ? options.project
        : defaultProjection as LogProjector<string>;
    return l.pipe(
        filter(v => v.level === level),
        map(project)
    );
}
export { subscribe } from './common/subscribe-in-tests'
