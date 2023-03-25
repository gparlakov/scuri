import { LogEntry } from '@angular-devkit/core/src/logger';
import { filter } from 'rxjs/operators';
import { setupBase } from './common';

describe('Calling update on existing specs without setup function', () => {
    const file = 'group-imports.ts';
    const folder = 'spec-update.group-imports';

    it('should pass successfully', async () => {
        const { run, fullFileName, add, testFileName,letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        const errors: LogEntry[] = [];
        letLogger(l => l
            .pipe(
                filter((v) => v.level === 'error')
            )
            .subscribe((v) => errors.push(v))
        );
        // act
        await run({ name: fullFileName, update: true });
        // assert
        expect(errors.length).toBe(0);
    });

    it('should import only missing deps and not duplicate deps (BDep is used multiple times), ', async () => {
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

    it('should not import deps with no path i.e. from dom or other tslibs, Object, Event', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, 'group-imports-from-dom.ts');
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatchSnapshot();
    });
});
