import { setupBase } from './common';

const folder = 'update-no-comma';
const file = 'c.ts';

describe('Calling update on existing spec with no new constructor params ', () => {
    it('should not add a comma in constructor params of builder build method', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        // act

        const result = await run({ name: fullFileName, update: true });
        const contents = result.readContent(testFileName);
        // assert
        expect(contents).toContain('C(bDep, logger)'); // used to add a comma like so -> C(bDep, logger, )
    });
});
