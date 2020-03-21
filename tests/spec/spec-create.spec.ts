import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

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

    describe('targeting a nested path file', () => {
        let tree: Tree;
        beforeEach(() => {
            tree = Tree.empty();
            tree.create('./a-folder/with/an/empty-class.ts', 'export class EmptyClass {}');
        });

        it('creates a file in the same path depth as the name passed in', () => {
            const runner = new SchematicTestRunner('schematics', collectionPath);
            const result = runner.runSchematic(
                'spec',
                { name: './a-folder/with/an/empty-class.ts' },
                tree
            );
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
                /it\('when third is called/
                //'method `third` is private - we should not create a test for it '
            );
            expect(contents).not.toMatch(
                /it\('when protectedMethod is called/
                //'method `protectedMethod` is protected - we should not create a test for it '
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

        it('adds the imports for the dependencies', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            // act
            const result = runner.runSchematic(
                'spec',
                { name: 'with-imports.component.ts' },
                treeImports
            );
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

        it('adds the imports for the dependencies when updating', () => {
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
            const result = runner.runSchematic(
                'spec',
                { name: 'with-imports.component.ts', update: true },
                treeImports
            );
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

    describe('with pre-exising spec (UPDATE)', () => {
        let treeWithASpec = Tree.empty();
        beforeEach(() => {
            treeWithASpec = Tree.empty();
            // a class with anotherStr and anotherService as constructor parameters
            treeWithASpec.create(
                'to-update.ts',
                `export class ToUpdate {
                    constructor(anotherStr: string, anotherService: Service) {}
                }`
            );
            // create a .spec file next to to-update.ts with the anotherStr and anotherService as constructor parameters
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
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');
            expect(contents.includes('ToUpdate(stringDependency, service)')).toBe(false);
        });

        it('adds the added dependencies', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');

            expect(contents.includes('let anotherStr: string;')).toBe(true);
            expect(contents.includes('const anotherService = autoSpy(Service);')).toBe(true);
        });

        it('adds the added dependencies to builder `exports`', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');
            expect(contents.includes(' anotherStr,')).toBe(true);
            expect(contents.includes(' anotherService,')).toBe(true);
        });

        it('adds the added dependencies to the class-under-test construction', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');
            expect(contents).toMatch(/return new ToUpdate\(anotherStr,\s*anotherService\)/);
        });

        it('Errors if the update flag is not passed in', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);
            treeWithASpec.overwrite('to-update.spec.ts', `Some other content`);

            // act
            // assert
            expect(() => {
                runner.runSchematic('spec', { name: 'to-update.ts' }, treeWithASpec);
            }).toThrow();
        });
    });

    describe('with pre-existing spec (UPDATE Methods)', () => {
        let treeWithASpec = Tree.empty();
        beforeEach(() => {
            treeWithASpec = Tree.empty();
            // a class with anotherStr and anotherService as constructor parameters
            treeWithASpec.create(
                'to-update.ts',
                `export class ToUpdate {
                    constructor() {}
                    oldMethod() {}
                    newMethod() {}
                }`
            );
            // create a .spec file next to to-update.ts with the anotherStr and anotherService as constructor parameters
            // it already has
            treeWithASpec.create(
                'to-update.spec.ts',
                `import { ToUpdate } from "./to-update";

                describe('ToUpdate', () => {
                    it('when oldMethod is called it should', () => {});
                });

                function setup() {
                    const builder = {
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

        it('adds the missing public method tests', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');
            expect(contents.includes('when newMethod is called it should')).toBe(true);
        });

        it('does not add (would duplicate) the existing public method tests', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');
            // splitting by the expected it description  - if there is one such it -
            // then we'll get 2 results otherwise - 1, 3 or more
            expect(contents.split('when oldMethod is called it should').length).toBe(
                2
                //"We expect to see 2 results because when splitting by the expected it description  - if there is one such it method - then we'll get 2 results otherwise - 1, 3 or more"
            );
        });

        it('adds the it at the correct location after the last it', () => {
            // arrange
            const runner = new SchematicTestRunner('schematics', collectionPath);

            // act
            // ToUpdate class has new deps - so we need to update the existing spec file
            const result = runner.runSchematic(
                'spec',
                { name: 'to-update.ts', update: true },
                treeWithASpec
            );
            // assert
            const contents = result.readContent('to-update.spec.ts');
            // splitting by the expected it description  - if there is one such it -
            // then we'll get 2 results otherwise - 1, 3 or more
            expect(contents).toMatch(
                /it\('when oldMethod is called it should', \(\) => \{\}\);(\r\n|\n\r|\n)\s*it\('when newMethod is called it should/
            );
        });

        describe('with no it methods', () => {
            let treeWithASpecAndOnlyDescribe: Tree;
            beforeEach(() => {
                treeWithASpecAndOnlyDescribe = Tree.empty();
                // a class with anotherStr and anotherService as constructor parameters
                treeWithASpecAndOnlyDescribe.create(
                    'to-update.ts',
                    `
export class ToUpdate {
    constructor() {}
    method() {}
}`
                );
                treeWithASpecAndOnlyDescribe.create(
                    'to-update.spec.ts',
                    `
import { ToUpdate } from "./to-update";
describe('ToUpdate', () => {

});

function setup() {
    const builder = {
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
            it('adds the it at the correct location after the last describe', () => {
                // arrange
                const runner = new SchematicTestRunner('schematics', collectionPath);

                // act
                // ToUpdate class has new deps - so we need to update the existing spec file
                const result = runner.runSchematic(
                    'spec',
                    { name: 'to-update.ts', update: true },
                    treeWithASpecAndOnlyDescribe
                );
                // assert
                const contents = result.readContent('to-update.spec.ts');
                // splitting by the expected it description  - if there is one such it -
                // then we'll get 2 results otherwise - 1, 3 or more
                expect(contents).toMatch(
                    /describe\('ToUpdate', \(\) => \{(\r\n|\n\r|\n)\s*it\('when method is called it should/
                );
            });
        });

        describe('when there are existing deps in the class-under-test constructor', () => {
            let treeForComma = Tree.empty();
            beforeEach(() => {
                treeForComma = Tree.empty();
                treeForComma.create(
                    't.ts',
                    `
class T {
    constructor(a: string, b:string) {}
}`
                );
                treeForComma.create(
                    't.spec.ts',
                    `
describe('existing spec', () => {
});
    function setup() {
        let a: string;
        const builder = {
            a,
            build() {
                return new T(a);
            }
        }
    }
`
                );
            });

            it('should add a comma at the start of the deps list', () => {
                // arrange
                let runner = new SchematicTestRunner('schematics', collectionPath);
                // act
                const result = runner.runSchematic(
                    'spec',
                    { name: 't.ts', update: true },
                    treeForComma
                );
                // assert
                const content = result.readContent('t.spec.ts');
                expect(content).toMatch(/return new T\(a, b\);/);
            });
        });
    });
});
