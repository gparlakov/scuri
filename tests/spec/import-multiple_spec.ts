import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';

const collectionPath = path.join(__dirname, '../../src/collection.json');

describe('When importing', () => {
    let treeWithMultipleImports = Tree.empty();
    treeWithMultipleImports.create(
        'with-imports.component.ts',
        `import { ADep, BDep } from '@angular/something';
export class WithImportsComponent {
    constructor(
        private aDep: ADep,
        private b: BDep
    ) {}
}`
    );

    it('with multiple imports from the same module should import all required', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic(
            'spec',
            { name: 'with-imports.component.ts' },
            treeWithMultipleImports
        );
        // assert
        const contents = result.readContent('with-imports.component.spec.ts');
        expect(contents).toMatch(`import { ADep } from '@angular/something';`)
        expect(contents).toMatch(`import { BDep } from '@angular/something';`)
    });
});
