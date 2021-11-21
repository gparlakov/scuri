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

/**
 * A helper function that subscribes to observable and aggregates the values in an array for ease of use.
 * @param to$ The observable to subscribe to
 * @param untilOrTimes The subscription ending count or other observable to signal the end of subscription
 * @example
 *  // arrange
    const values = subscribe(c.dealDocument$, destroy$);
    // act
    c.approveDocuments([{ docId: '1123' } as DocumentAndIcon]);
    // assert
    expect(values[1]).toEqual([{ docId: '1235', blobUrl: undefined, icon: 'assets/images/disclosure.svg' }]);
 */
export function subscribe<T>(to$: Observable<T>, untilOrTimes: number | Observable<any> = 1): T[] {
    const values: T[] = [];

    const piped$ = isObservable(untilOrTimes)
        ? to$.pipe(takeUntil(untilOrTimes))
        : to$.pipe(take(untilOrTimes));
    piped$.subscribe(v => values.push(v), e => values.push(e));

    return values;
}

