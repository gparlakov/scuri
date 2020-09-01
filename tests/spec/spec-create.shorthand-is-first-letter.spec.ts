import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

const source = 'c.ts';
const spec = 'c.spec.ts';
describe('spec', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = Tree.empty();
    });
    it('scaffolds a test case with shorthand `c` for empty (c)ustomerComponent', () => {
        tree.create(source, 'export class CustomerComponent {}');
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: source }, tree);
        // assert
        const contents = result.readContent(spec);

        expect(contents).toMatch('const c = build();');
    });

    it('scaffolds a test case with shorthand `c` for (c)ustomerComponent', () => {
        tree.create(source, 'export class CustomerComponent { method(){} }');
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: source }, tree);
        // assert
        const contents = result.readContent(spec);

        expect(contents).toMatch('const c = build();');
        expect(contents).toMatch('c.method();');
    });

    it('scaffolds a test case with shorthand `a` for (a)uthService', () => {
        tree.create(source, 'export class AuthService { login(){} }');
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: source }, tree);
        // assert
        const contents = result.readContent(spec);

        expect(contents).toMatch('const a = build();');
        expect(contents).toMatch('a.login();');
    });

    it('scaffolds a test case with shorthand `a` for empty (a)uthService', () => {
        tree.create(source, 'export class AuthService { }');
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: source }, tree);
        // assert
        const contents = result.readContent(spec);

        expect(contents).toMatch('const a = build();');
    });
});
