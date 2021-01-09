import { update } from '../../src/spec/update/update';
import { RemoveChange } from '../../lib/utility/change';
import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath } from './common';

describe('Update a spec', () => {
    it('should return a remove list', () => {
        const result = update(
            './test',
            `import { autoSpy } from 'autoSpy';
import { ExampleComponent } from './example.component';

describe('ExampleComponent', () => {
});

function setup() {
    let dep:string;
    const service = autoSpy(Object);
    const builder = {
        dep,
        service,
        default() {
            return builder;
        },
        build() {
            return new ExampleComponent(dep,service);
        }
    };

    return builder;
}`,
            [],
            'ExampleComponent',
            'remove',
            [],
            'a'
        );

        const removes = result.filter(r => r instanceof RemoveChange);
        // expecting 6 removes
        expect(removes.length).toBe(6);
        // order is the position of the remove
        expect(removes[0].order).toBe(152); // let dep:string;
        expect(removes[1].order).toBe(172); // const service = autoSpy(Object);
        expect(removes[2].order).toBe(231); // dep in builder
        expect(removes[3].order).toBe(244); // service in builder
        expect(removes[4].order).toBe(379); // dep, in ExampleComponent(dep, service)
        expect(removes[5].order).toBe(383); // service in ExampleComponent(dep, service)
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
                    it('when oldMethod is called it should', () => {
                        c.oldMethod();
                    });
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
            expect(contents).toMatch(
                /it\('when oldMethod is called it should', \(\) => \{(\r\n|\n\r|\n)\s*c\.oldMethod\(\);(\r\n|\n\r|\n)\s*\}\);(\r\n|\n\r|\n)\s*it\('when newMethod is called it should/
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

            it('uses the correct shorthand (ToUpdate shorthand t)', () => {
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
                expect(contents).toMatch('t.method();');
                expect(contents).toMatch('expect(t).toEqual');
            });
        });

        describe('when there are existing deps in the class-under-test constructor', () => {
            let treeForComma = Tree.empty();
            beforeEach(() => {
                treeForComma = Tree.empty();
                treeForComma.create(
                    't.ts',
                    `
export class T {
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
