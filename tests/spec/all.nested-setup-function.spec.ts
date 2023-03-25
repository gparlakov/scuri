import { setupBase } from './common';

const folder = 'nested-setup-function';
const file = 'c.ts';

describe('Nested setup functions should not break', () => {
    it('update', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        // @ts-ignore
        const contents = result.readContent(testFileName);
        // update should add LogService to imports, to construct params and create a spy for it
        expect(contents).toContain("import { BDep, LogService } from '@a");
        expect(contents).toContain('C(bDep, logger)');
        expect(contents).toContain(`const logger = autoSpy(LogService);`);
    });
});
