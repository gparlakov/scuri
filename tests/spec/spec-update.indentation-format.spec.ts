import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { filter } from 'rxjs/operators';
import { collectionPath } from './common';

describe('Calling update on existing specs without setup function', () => {
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
}`
        );

        tree.create(
            'c.spec.ts',
            `import { bDep } from '@angular/core';

describe('C', () => {
});`
        );
    });

    xit('should pass successfully', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const errors = [];
        runner.logger.pipe(filter(v => v.level === 'error')).subscribe(v => errors.push(v));
        runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        // assert
        expect(errors.length).toBe(0);
    });

    it('should create the setup function and then update it', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: './c.ts', update: true }, tree);
        // assert
        // @ts-ignore
        const contents = result.readContent('./c.spec.ts');
        // update should add LogService to imports, to construct params and create a spy for it
        expect(contents).toMatchInlineSnapshot(`
            "import { LogService } from '@angular/core';
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
            }"
        `);
    });
});
