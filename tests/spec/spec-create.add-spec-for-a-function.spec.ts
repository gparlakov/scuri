import { setupBase } from './common';

const folder = 'add-spec-for-a-function';
const file = 'add.ts';

describe('When source file has only function', () => {

    it('create should create a describe and one test case for the function', async  () => {
         // arrange
         const { run, fullFileName, add, testFileName } = setupBase(folder, file);
         add(fullFileName);
         // act
         const result = await run({name: fullFileName, update: false});

        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch(`import { add } from './add';`);
        expect(contents).toMatch(`describe('add', () => {`);
        expect(contents).toMatch(`  it('it should', () => {`);
        expect(contents).toMatch(`    // arrange`);
        expect(contents).toMatch(`    // act`);
        expect(contents).toMatch(`    const x = add();`);
        expect(contents).toMatch(`    // assert`);
        expect(contents).toMatch(`    // expect(x).toEqual()`);
        expect(contents).toMatch(`  });`);
        expect(contents).toMatch(`});`);
    });
});
