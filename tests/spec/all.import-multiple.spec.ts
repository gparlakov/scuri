import { setupBase } from './common';
const folder = 'all.import-multiple';
const file = 'with-imports.component.ts';

describe('When importing multiple declarations from the same module', () => {
    it('update should import all required', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, file);
        add(fullFileName);
        add(testFileName);
        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch(`import { ADep, BDep } from '../my/relative/path';`);
        expect(contents).toContain(`import { DDep, Router } from '@angular/router';`);
    });

    it('create should import all required', async () => {
        // arrange
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, 'with-imports-for-create.component.ts');
        add(fullFileName);
        // act
        const result = await run({ name: fullFileName, update: false });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toMatch(`import { ADep } from '../my/relative/path';`);
        expect(contents).toMatch(`import { BDep } from '../my/relative/path';`);
        expect(contents).toContain(`import { Router } from '@angular/router';`);
        expect(contents).toContain(`import { DDep } from '@angular/router';`);
    });
});
