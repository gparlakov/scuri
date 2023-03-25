import { LogEntry } from '@angular-devkit/core/src/logger';
import { filter } from 'rxjs/operators';
import { setupBase } from './common';

const folder = 'spec-update-spec-without-setup-function';
const file = 'spec-without-setup.component.ts';
describe('Calling update on existing specs without setup function', () => {
    it('should pass successfully', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);

        // act
        const errors: LogEntry[] = [];
        letLogger((logger) =>
            logger.pipe(filter((v) => v.level === 'error')).subscribe((v) => errors.push(v))
        );
        await run({ name: fullFileName, update: true }).catch((e) => {});
        // assert
        expect(errors.length).toBe(0);
    });

    it('should create the setup function and then update it', async () => {
        // arrange
        const { run, fullFileName, add, testFileName, } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);

        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        // @ts-ignore
        const contents = result.readContent(testFileName);
        // update should add LogService to imports, to construct params and create a spy for it
        expect(contents).toContain(`function setup() {`);
        expect(contents).toContain("import { bDep, LogService } from '@angular/core';");
        expect(contents).toContain('C(bDep, logger)');
        expect(contents).toContain(`const logger = autoSpy(LogService);`);
    });
});
