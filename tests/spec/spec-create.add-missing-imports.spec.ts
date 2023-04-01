import { setupBase } from './common';

describe('spec', () => {
    const folder = 'create.add-missing-imports';
    const file = 'component.ts';

    it('adds the imports for the Observable dependencies when creating', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        // act
        const result = await run({ name: fullFileName, update: false });

        // assert
        const contents = result!.readContent(testFileName);
        expect(contents).toMatch("import { EMPTY, Observable, ReplaySubject } from 'rxjs';");
        expect(contents).toMatch("import { autoSpy } from 'autoSpy';");
    });

    it('adds the imports for the Observable dependencies when updating', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(
            'update.add-missing-imports',
            file
        );
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });
        // act
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch("import { EMPTY, Observable, ReplaySubject } from 'rxjs';");
        expect(contents).toMatch("import { autoSpy } from 'autoSpy';");
    });
});
