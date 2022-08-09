import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('spec', () => {
    let tree: Tree;
    beforeEach(() => {
        tree = Tree.empty();
        tree.create('empty-class.ts', 'export class EmptyClass {}');
    });

    it('throws when name is not passed in', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        return runner.runSchematicAsync('spec', {}, tree).toPromise()
            .then(() => fail('should throw'))
            .catch(e => expect(e).toBeDefined());;
    });

    it('creates a file when name is passed in', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        const result = await runner.runSchematicAsync('spec', { name: 'empty-class.ts'}, tree).toPromise();
        expect(result.files.length).toBe(2); // the empty class + the new spec file
        expect(result.files[1]).toMatch('empty-class.spec.ts');
    });

    it('creates a file with a non-empty content ', async  () => {
        // arrange
        const runner = new SchematicTestRunner('schematics', collectionPath);
        // act
        const result = await runner.runSchematicAsync('spec', { name: 'empty-class.ts' }, tree).toPromise();
        // assert
        expect(result.readContent('empty-class.spec.ts').length).toBeGreaterThan(0);
    });

    describe('targeting the EmptyClass', () => {
        it('creates a file with the boilerplate setup method ', async  () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = await runner.runSchematicAsync('spec', { name: 'empty-class.ts' }, tree).toPromise();
            // assert
            const contents = result.readContent('empty-class.spec.ts');
            expect(contents).toMatch(/function setup\(\) {/);
            expect(contents).toMatch(/const builder = {/);
            expect(contents).toMatch(/return new EmptyClass\(\);/);
        });
    });

    describe('targeting a nested path file', () => {
        let tree: Tree;
        beforeEach(() => {
            tree = Tree.empty();
            tree.create('./a-folder/with/an/empty-class.ts', 'export class EmptyClass {}');
        });

        it('creates a file in the same path depth as the name passed in', async  () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const result = await runner.runSchematicAsync(
                'spec',
                { name: './a-folder/with/an/empty-class.ts' },
                tree
            ).toPromise();
            expect(result.files.length).toBe(2); // the empty class + the new spec file
            expect(result.files[1]).toMatch('/a-folder/with/an/empty-class.spec.ts');
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
        it('it creates boilerplate with a new instance with one matching constructor parameter ', async  () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = await runner.runSchematicAsync(
                'spec',
                { name: 'has-one-constructor-parameter.ts' },
                tree
            ).toPromise();
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

        it('creates a file with matching number of `it` calls for each public method ', async  () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = await runner.runSchematicAsync(
                'spec',
                { name: 'example.component.ts' },
                exampleComponentTree
            ).toPromise();
            // assert
            const contents = result.readContent('example.component.spec.ts');
            expect(contents).toMatch(/it\('when aMethod is called/);
            expect(contents).toMatch(/it\('when anotherMethod is called/);
            expect(contents).toMatch(/it\('when fourth is called/);
            expect(contents).not.toMatch(
                /it\('when third is called/
                //'method `third` is private - we should not create a test for it '
            );
            expect(contents).not.toMatch(
                /it\('when protectedMethod is called/
                //'method `protectedMethod` is protected - we should not create a test for it '
            );
        });

        it('creates a file with `it` tests actually calling the public methods of the component/class ', async  () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = await runner.runSchematicAsync(
                'spec',
                { name: 'example.component.ts' },
                exampleComponentTree
            ).toPromise();
            // assert
            const contents = result.readContent('example.component.spec.ts');
            expect(contents).toMatch(/it\('when aMethod is called/); // the `it` test method
            expect(contents).toMatch(/\.aMethod\(\)/g); // the call to the component's `aMethod` method
        });
    });

    describe('targeting a class with imports', () => {
        let treeImports: Tree;
        beforeEach(() => {
            treeImports = Tree.empty();

            treeImports.create(
                'with-imports.component.ts',
                `import { Router } from '@angular/core';
                import { ADep} from '../../deps/a-dep.ts';
                import {local} from './local.ts'
                import * as AnotherDep from './local-deps/a-depth.service.ts';

                export class WithImportsComponent {

                    constructor(
                      private router: Router,
                      private aDep: ADep,
                      private anoter: AnotherDep,
                      local: local,
                      simple: Object
                    ) {}
                }`
            );
        });

        it('adds the imports for the dependencies', async  () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = await runner.runSchematicAsync(
                'spec',
                { name: 'with-imports.component.ts' },
                treeImports
            ).toPromise();
            // assert
            const contents = result.readContent('with-imports.component.spec.ts');
            expect(contents).toMatch(`import { Router } from '@angular/core';`);
            expect(contents).toMatch(`import { ADep } from '../../deps/a-dep.ts';`);
            expect(contents).toMatch(
                `import { AnotherDep } from './local-deps/a-depth.service.ts';`
            );
            expect(contents).toMatch(`import { local } from './local.ts';`);
            expect(contents).not.toMatch(`import { Object } from ''`);
        });

        it('adds the imports for the dependencies when updating', async  () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            treeImports.create(
                'with-imports.component.spec.ts',
                `describe("WithImports", () => {});
                function setup() {
                    const builder = {
                        default() {
                            return builder;
                        },
                        build() {
                            return new WithImportsComponent();
                        }
                    };
                    return builder;
                }
            `
            );
            const result = await runner.runSchematicAsync(
                'spec',
                { name: 'with-imports.component.ts', update: true },
                treeImports
            ).toPromise();
            // assert
            const contents = result.readContent('with-imports.component.spec.ts');
            expect(contents).toMatch(`import { Router } from '@angular/core';`);
            expect(contents).toMatch(`import { ADep } from '../../deps/a-dep.ts';`);
            expect(contents).toMatch(
                `import { AnotherDep } from './local-deps/a-depth.service.ts';`
            );
            expect(contents).toMatch(`import { local } from './local.ts';`);
            expect(contents).not.toMatch(`import { Object } from ''`);
        });
    });
});
