import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath, getTestFile, getTestFileContents } from './common';

describe('spec', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = Tree.empty();
    });

    it('adds the imports for the Observable dependencies when creating', async () => {
        // arrange
        const fileUnderTest = 'component.ts';
        const filePath = getTestFile(`create.add-missing-imports/${fileUnderTest}`);
        const specFileName = filePath.replace('.ts', '.spec.ts');
        tree.create(filePath, getTestFileContents(filePath));
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // runner.logger.subscribe(m => console.log(m.message))
        // act
        const result = await runner.runSchematicAsync('spec', { name: filePath }, tree).toPromise();
        // assert
        const contents = result.readContent(specFileName);
        expect(contents).toMatch("import { EMPTY, Observable, ReplaySubject } from 'rxjs';");
        expect(contents).toMatch("import { autoSpy } from 'autoSpy';");
    });

    it('adds the imports for the Observable dependencies when updating', async () => {
        // arrange
        const fileUnderTest = 'component.ts';
        const filePath = getTestFile(`update.add-missing-imports/${fileUnderTest}`);
        tree.create(filePath, getTestFileContents(filePath));
        const specFilePath = filePath.replace('.ts', '.spec.ts');
        tree.create(specFilePath, getTestFileContents(specFilePath));
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // runner.logger.subscribe(m => console.log(m.message))
        // act
        const result = await runner.runSchematicAsync('spec', { name: filePath, update: true }, tree).toPromise();
        // assert
        const contents = result.readContent(specFilePath);
        expect(contents).toMatch("import { EMPTY, Observable, ReplaySubject } from 'rxjs';");
        expect(contents).toMatch("import { autoSpy } from 'autoSpy';");
    });
});
