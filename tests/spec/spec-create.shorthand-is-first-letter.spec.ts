import { setupBase } from './common';

const fileName = 'shorthand-test.ts';
const fileName1 = 'shorthand-test-1.ts';
const folderName = 'spec-create.shorthand-is-first-letter';
describe('spec', () => {
    it('scaffolds a test case with shorthand `c` for empty (c)ustomerComponent', async  () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folderName, fileName);
        add(fullFileName);

        // act
        const result = await run({ name: fullFileName});
        // assert
        const contents = result.readContent(testFileName);

        expect(contents).toMatch('const c = build();');
        expect(contents).toMatch('c.method();');
    });

    it('scaffolds a test case with shorthand `a` for empty (a)uthService', async  () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folderName, fileName1);
        add(fullFileName);

        // act
        const result = await run({ name: fullFileName});
        // assert
        const contents = result.readContent(testFileName);

        expect(contents).toMatch('const a = build();');
        expect(contents).toMatch('a.login()');
    });
});
