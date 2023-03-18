import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { EOL } from 'os';
import { collectionPath, setupBase } from './common';

describe('Calling update on existing spec with the TestBed.configureTestingModule', () => {
    let tree = Tree.empty();
    const folder = 'spec-update.testbed-tests';
    const fileName = 'c.ts';

    it('when setup function call missing should add a the setup function call with appropriate indentation', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, fileName);
        add(fullFileName);
        add(testFileName);

        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);

        // assert
        expect(contents).toContain(`        const a = setup().default();${EOL}        TestBed`);
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: bDep, useValue: a.bDep },`
        );
        expect(contents).toContain(`{ provide: LogService, useValue: a.logger }] })`);
    });

    it('when setup function call existing should use that and add missing dependencies', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, 'c-with-some-deps.ts');
        add(fullFileName);
        add(testFileName);

        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: bDep, useValue: setupInstance.bDep },`
        );
        expect(contents).toContain(`{ provide: LogService, useValue: setupInstance.logger }] })`);
    });

    it('when one of the providers is already provided and the other is not it should add the other provider to configureTestingModule providers', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, 'c-some-providers.ts');
        add(fullFileName);
        add(testFileName);

        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);
        // assert
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: LogService, useValue: a.logger }] })`
        );
    });

    it('when setup function call existing is destructured it should add a new call to setup and use that for the providers', async () => {
        // arrange
        const { run, fullFileName, add, testFileName } = setupBase(folder, 'c-setup-destructured.ts');
        add(fullFileName);
        add(testFileName);

        // act
        const result = await run({ name: fullFileName, update: true });
        // assert
        const contents = result.readContent(testFileName);

        // assert
        expect(contents).toContain('const a = setup().default();');
        expect(contents).toContain(
            `.configureTestingModule({ providers: [{ provide: bDep, useValue: a.bDep },`
        );
        expect(contents).toContain(`{ provide: LogService, useValue: a.logger }] })`);
    });
});
