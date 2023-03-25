import { LogEntry } from '@angular-devkit/core/src/logger';
import { Tree } from '@angular-devkit/schematics';
import { filter } from 'rxjs/operators';
import { setupBase } from './common';


const folder = 'update-by-giving-spec-name';
const file = 'c.ts';

describe('Calling update and passing the spec file in --name ', () => {
    let tree = Tree.empty();

    beforeEach(() => {
        tree = Tree.empty();
    });

    it('should work and not throw errors', async  () => {
        // arrange
        const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        // act
        const errors:LogEntry[] = [];
        letLogger(logger => logger.pipe(filter(v => v.level === 'error')).subscribe(v => errors.push(v)));
        await run({ name: fullFileName, update: true }).catch(e => fail('Failing on purpose: There should not be any errors here'));
        // assert
        expect(errors.length).toBe(0);
    });

    it('should update the spec file', async  () => {
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName)
        // act
        const result = await run({ name: fullFileName, update: true });
        const contents = result.readContent(testFileName);
        // assert
        expect(contents).toContain('const logger = autoSpy(LogService);');
        expect(contents).toContain('function setup() {');
        expect(contents).toContain('return new C(bDep, logger);');
    });
});
