import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('Nested setup functions should not break', () => {
    let tree = Tree.empty();

    tree.create(
        'c.ts',
        `import { LogService, BDep } from '@angular/core';

        export class C  {
            constructor(
                private bDep: BDep,
                private logger: LogService
            ) {}
        `
    );

    tree.create(
        'c.spec.ts',
        `import { BDep } from '@angular/core';

        describe('C', () => {

            function setup() {
                let bDep: SpyOf<ActivatedRoute> = autoSpy(bDep);
                const builder = {
                    bDep,
                    build: () => {
                        return new C(bDep);
                    },
                };

                return builder;
            }
        });`
    );

    it('update', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        // assert
        // @ts-ignore
        const contents = result.readContent('./c.spec.ts');
        // update should add LogService to imports, to construct params and create a spy for it
        expect(contents).toContain("import { BDep, LogService } from '@angular/core';");
        expect(contents).toContain('C(bDep, logger)');
        expect(contents).toContain(`const logger = autoSpy(LogService);`);
    });
});
