import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('When importing multiple declarations from the same module', () => {
    let treeWithMultipleImports = Tree.empty();
    treeWithMultipleImports.create(
        'with-imports.component.ts',
        `import { ADep, BDep } from '../my/relative/path';
import { Router, DDep } from '@angular/router';

export class WithImportsComponent {
    constructor(
        private aDep: ADep,
        private d: DDep,
        private b: BDep,
        private router: Router,
    ) {}
}`
    );

    treeWithMultipleImports.create(
        'with-imports.component.spec.ts',
        `import { ADep } from '../my/relative/path';
import { DDep } from '@angular/router';
import { WithImportsComponent } from './with-imports.component';
import { autoSpy } from 'autoSpy';

describe('WithImportsComponent', () => {

});

function setup() {
    const aDep = autoSpy(aDep);
    const dDep = autoSpy(DDep);
    const builder = {
        dDep,
        aDep,
        default() {
            return builder;
        },
        build() {
            return new WithImportsComponent(aDep,dDep);
        }
    };

    return builder;
}`
    );

    it('update should import all required', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic(
            'spec',
            { name: 'with-imports.component.ts', update: true },
            treeWithMultipleImports
        );
        // assert
        const contents = result.readContent('with-imports.component.spec.ts');
        expect(contents).toMatch(`import { ADep, BDep } from '../my/relative/path';`);
        expect(contents).toContain(`import { DDep, Router } from '@angular/router';`);
    });

    it('create should import all required', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        treeWithMultipleImports.delete('with-imports.component.spec.ts');
        // act
        const result = runner.runSchematic(
            'spec',
            { name: 'with-imports.component.ts', update: false },
            treeWithMultipleImports
        );
        // assert
        const contents = result.readContent('with-imports.component.spec.ts');
        expect(contents).toMatch(`import { ADep } from '../my/relative/path';`);
        expect(contents).toMatch(`import { BDep } from '../my/relative/path';`);
        expect(contents).toContain(`import { Router } from '@angular/router';`);
        expect(contents).toContain(`import { DDep } from '@angular/router';`);
    });
});
