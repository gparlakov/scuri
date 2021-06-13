import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { filter } from 'rxjs/operators';
import { collectionPath } from './common';

describe('Calling update', () => {
    let tree = Tree.empty();

    beforeEach(() => {
        tree = Tree.empty();
        tree.create(
            'c.ts',
            `import { LogService, BDep } from '@angular/core';

            export class C  {
                public methodOne() {}
                methodTwo() {}
                methodThree() {}
            `
        );

        tree.create(
            'c.spec.ts',
            `import { bDep } from '@angular/core';

describe('C', () => {
    it('existing method one test', () => {
        c.methodOne();
    })
    it('existing test case with name of methodTwo in the spec title', () => {
        c.methodTwo();
    })
    it('just any name', () => {
        c.methodThree();
    })
});`
        );
    });

    it('should work and not throw errors', async  () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const errors = [];
        runner.logger.pipe(filter(v => v.level === 'error')).subscribe(v => errors.push(v));
        await runner.runSchematicAsync('spec', { name: './c.spec.ts', update: true }, tree).toPromise();
        // assert
        expect(errors.length).toBe(0);
    });

    it('should update the spec file', async  () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner.runSchematicAsync('spec', { name: './c.spec.ts', update: true }, tree).toPromise();
        const contents = result.readContent('./c.spec.ts');
        // assert
        expect(contents).toEqual(`import { bDep } from '@angular/core';

describe('C', () => {
    it('existing method one test', () => {
        c.methodOne();
    })
    it('existing test case with name of methodTwo in the spec title', () => {
        c.methodTwo();
    })
    it('just any name', () => {
        c.methodThree();
    })
});
function setup() {
    const builder = {
        default() {
            return builder;
        },
        build() {
            return new C();
        }
    }
    return builder;
}`);
    });
});
