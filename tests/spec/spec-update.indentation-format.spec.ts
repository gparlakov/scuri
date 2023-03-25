import { LogEntry } from '@angular-devkit/core/src/logger';
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { subscribe } from '../common/subscribe-in-tests';
import { collectionPath, setupBase } from './common';

const folder = 'spec-update.indentation-format';
const file = 'indentation-component.ts';
describe('Calling update on existing specs without setup function', () => {
    it('should pass successfully', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);

        const stop$ = new Subject();
        const errors: LogEntry[] = [];

        letLogger((logger) =>
            subscribe(
                logger.pipe(
                    map((l) => {
                        if (l.level === 'error') {
                            errors.push(l);
                        }
                    })
                ),
                stop$
            )
        );

        // act
        await run({ name: fullFileName, update: true }).catch((e) => {
            fail('Failing b/c this is expected to pass w/o errors');
        });

        // assert
        expect(errors.length).toBe(0);
    });

    it('should indent setup function variable declarations', async () => {
         // arrange
         const { run, fullFileName, add, testFileName } = setupBase(folder, file);
         add(fullFileName);
         add(testFileName);

                 // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatchSnapshot();
    });
});
