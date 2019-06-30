import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import { readdirSync, statSync, readFileSync } from 'fs';

const collectionPath = path.join(__dirname, '../../src/collection.json');

function file(name: string) {
    return path.join(__dirname, 'files', name);
}

// @ts-ignore
function treeFromFiles(): Tree {
    const tree = Tree.empty();
    readdirSync(file(''))
        .filter(f => statSync(file(f)).isFile)
        .forEach(f => tree.create(file(f), readFileSync(file(f))));
    return tree;
}

describe('spec', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = Tree.empty();
        tree.create('empty-class.ts', 'export class EmptyClass {}');
    });

    it('throws when name is not passed in', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        expect(() => runner.runSchematic('spec', {}, tree)).toThrow();
    });

    it('creates a file when name is passed in', () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const result = runner.runSchematic('spec', { name: 'empty-class.ts' }, tree);
        expect(result.files.length).toBe(2); // the empty class + the new spec file
        expect(result.files[1]).toMatch('empty-class.spec.ts');
    });

    it('creates a file with a non-empty content ', () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = runner.runSchematic('spec', { name: 'empty-class.ts' }, tree);
        // assert
        expect(result.readContent('empty-class.spec.ts').length).toBeGreaterThan(0);
    });

    describe('targeting the EmptyClass', () => {
        it('creates a file with the boilerplate setup method ', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = runner.runSchematic('spec', { name: 'empty-class.ts' }, tree);
            // assert
            const contents = result.readContent('empty-class.spec.ts');
            expect(contents).toMatch(/function setup\(\) {/);
            expect(contents).toMatch(/const builder = {/);
            expect(contents).toMatch(/return new EmptyClass\(\);/);
        });
    });

    describe('targeting the has-one-constructor-param class', () => {
        beforeEach(() => {
            tree = Tree.empty();

            tree.create(
                'has-one-constructor-parameter.ts',
                `export class HasOneConstructorParameter {
                    constructor(service: Object) {}
                }`
            );
        });
        it('it creates boilerplate with a new instance with one matching constructor parameter ', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = runner.runSchematic(
                'spec',
                { name: 'has-one-constructor-parameter.ts' },
                tree
            );
            // assert
            const contents = result.readContent('has-one-constructor-parameter.spec.ts');
            expect(contents).toMatch(/return new HasOneConstructorParameter\(service\);/);
        });
    });

    describe('targeting the example component class', () => {
        let exampleComponentTree: Tree;
        beforeEach(() => {
            exampleComponentTree = Tree.empty();

            exampleComponentTree.create(
                'example.component.ts',
                `export class ExampleComponent {
                    publicProperty: boolean;

                    private privateProperty: string;

                    aMethod(dep: string, service: Object) {}

                    //a constructor comment
                    constructor(
                      /** shows in full text and is hidden in text */ dep: string,
                      service: Object
                    ) {}

                    // an async public method
                    async anotherMethod() {}
                    private third() {}
                    public fourth() {}
                    protected protectedMethod() {}
                  }
                  `
            );
        });

        it('creates a file with matching number of `it` calls for each public method ', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = runner.runSchematic(
                'spec',
                { name: 'example.component.ts' },
                exampleComponentTree
            );
            // assert
            const contents = result.readContent('example.component.spec.ts');
            expect(contents).toMatch(/it\('when aMethod is called/);
            expect(contents).toMatch(/it\('when anotherMethod is called/);
            expect(contents).toMatch(/it\('when fourth is called/);
            expect(contents).not.toMatch(
                /it\('when third is called/,
                'method `third` is private - we should not create a test for it '
            );
            expect(contents).not.toMatch(
                /it\('when protectedMethod is called/,
                'method `protectedMethod` is protected - we should not create a test for it '
            );
        });

        it('creates a file with `it` tests actually calling the public methods of the component/class ', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = runner.runSchematic(
                'spec',
                { name: 'example.component.ts' },
                exampleComponentTree
            );
            // assert
            const contents = result.readContent('example.component.spec.ts');
            expect(contents).toMatch(/it\('when aMethod is called/); // the `it` test method
            expect(contents).toMatch(/\.aMethod\(\)/g); // the call to the component's `aMethod` method
        });
    });

    describe('with pre-exising spec (UPDATE)', () => {
        let treeWithASpec = Tree.empty();
        beforeEach(() => {
            // a class with anotherStr and anotherSer as constructor parameters
            treeWithASpec.create(
                'to-update.ts',
                `export class ToUpdate {
                    constructor(anotherStr: string, anotherSer: Object) {}
                }`
            );
            // create a .spec file next to to-update.ts with the anotherStr and anotherServ as constructor parameters
            treeWithASpec.create(
                'to-update.spec.ts',
                `import { ToUpdate } from "./to-update";

                describe("ToUpdate", () => {});

                function setup() {
                    let stringDependency: string;
                    const service = autoSpy(Object);
                    const builder = {
                    stringDependency,
                    service,
                    default() {
                        return builder;
                    },
                    build() {
                        return new ToUpdate(stringDependency, service);
                    }
                    };

                    return builder;
                }`
            );
        });

        it('removes the removed dependencies', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic('spec', { name: 'to-update.ts' }, treeWithASpec);
            // assert
            const contents = result.readContent('to-update.spec.ts');
            // console.log(contents);
            expect(contents.includes('ToUpdate(stringDependency, service)')).toBeFalsy();
        });
    });
});
