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
                mehodThree() {}
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

    it('should work and not throw errors', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const errors = [];
        runner.logger.pipe(filter(v => v.level === 'error')).subscribe(v => errors.push(v));
        runner.runSchematic('spec', { name: './c.spec.ts', update: true }, tree);
        // assert
        expect(errors.length).toBe(0);
    });

    it('should update the spec file', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: './c.spec.ts', update: true }, tree);
        const contents = result.readContent('./c.spec.ts');
        // assert
        expect(contents).toEqual(`describe('C', () => {
            it('existing method one test', () => {
                c.methodOne();
            })
            it('existing test case with name of methodTwo in the spec title', () => {
                c.methodTwo();
            })
            it('just any name', () => {
                c.methodThree();
            })
        });`);
    });
});
