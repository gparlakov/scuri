import { setupBase } from './common';

const file = 'empty-class.ts'
const folder = 'spec-create-when-no-public-methods'

describe('spec', () => {

    it('creates a file with the boilerplate setup method ', async  () => {
         // arrange
         const { run, fullFileName, add, testFileName, letLogger } = setupBase(folder, file);
         add(fullFileName);

        // act
        const result = await run({ name: fullFileName });
        // assert
        const contents = result.readContent(testFileName);

        const eol = '(\\r\\n|\\n)\\s*';
        expect(contents).toMatch(
            new RegExp(
                `it\\('it should construct', \\(\\) => \\{${eol}` +
                    `\\/\\/ arrange${eol}` +
                    `const \\{ build \\} = setup\\(\\).default\\(\\);${eol}` +
                    `\\/\\/ act${eol}` +
                    `const e = build\\(\\);${eol}` +
                    `\\/\\/ assert${eol}` +
                    `\\/\\/ expect\\(e\\).toEqual${eol}`
            )
        );
    });
});
