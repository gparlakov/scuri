import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('Calling update on existing spec with no new constructor params ', () => {
    let tree = Tree.empty();
    beforeEach(() => {
        tree = Tree.empty();

        tree.create(
            'c.ts',
            `import { LogService, BDep } from '@angular/core';

        export class C  {
            constructor(
                private bDep: bDep,
                private logger: LogService
            ) {}
        `
        );

        tree.create(
            'c.spec.ts',
            `
import { bDep } from '@angular/core';

describe('C', () => {
});

function setup() {
    const bDep = autoSpy(bDep);
    const logger = autoSpy(LogService);
    const builder = {
        bDep,
        logger,
        default() {
            return builder;
        },
        build() {
            return new C(bDep, logger);
        }
    }
    return builder;
}
        `
        );
    });

    it('should not add a comma in constructor params of builder build method', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act

        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        const contents = result.readContent('c.spec.ts');
        // assert
        expect(contents).toContain('C(bDep, logger)'); // used to add a comma like so -> C(bDep, logger, )
    });
});
