import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner } from '@angular-devkit/schematics/testing';
import { collectionPath, setupBase } from './common';

const folder = 'spec-create';
const emptyClass = 'empty-class.ts';

describe('spec', () => {
    // let tree: Tree;
    // beforeEach(() => {
    //     tree = Tree.empty();
    //     tree.create('empty-class.ts', 'export class EmptyClass {}');
    // });
    it('throws when name is not passed in', async  () => {
        const runner = new SchematicTestRunner('schematics', collectionPath);
        return runner.runSchematicAsync('spec', {}, Tree.empty()).toPromise()
            .then(() => fail('should throw'))
            .catch(e => expect(e).toBeDefined());
    });

    it('creates a file with non-empty content when name is passed in', async  () => {
        const { run, fullFileName, testFileName, add } = setupBase(folder, emptyClass);
        add(fullFileName);
        const result = await run({ name: fullFileName });

        expect(result.files.length).toBe(2); // the empty class + the new spec file
        expect(result.readContent(testFileName).length).toBeGreaterThan(0);

    });

    describe('targeting the EmptyClass', () => {
        it('creates a file with the boilerplate setup method ', async  () => {
            const { run, fullFileName, testFileName, add, splitLines } = setupBase(folder, emptyClass);
            add(fullFileName);
            const result = await run({ name: fullFileName });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents).toMatch(/function setup\(\) {/);
            expect(contents).toMatch(/const builder = {/);
            expect(contents).toMatch(/return new EmptyClass\(\);/);

            const lines = splitLines(contents);
            let i = 0;
            expect(lines[i++]).toEqual("import { EmptyClass } from './empty-class';");
            expect(lines[i++]).toEqual('');
            expect(lines[i++]).toEqual("describe('EmptyClass', () => {");
            expect(lines[i++]).toEqual('  ');
            expect(lines[i++]).toEqual("  it('it should construct', () => {");
            expect(lines[i++]).toEqual('    // arrange');
            expect(lines[i++]).toEqual('    const { build } = setup().default();');
            expect(lines[i++]).toEqual('    // act');
            expect(lines[i++]).toEqual('    const e = build();');
            expect(lines[i++]).toEqual('    // assert');
            expect(lines[i++]).toEqual('    // expect(e).toEqual');
            expect(lines[i++]).toEqual('  });');
            expect(lines[i++]).toEqual('  ');
            expect(lines[i++]).toEqual('});');
            expect(lines[i++]).toEqual('');
            expect(lines[i++]).toEqual('function setup() {');
            expect(lines[i++]).toEqual('  ');
            expect(lines[i++]).toEqual('  const builder = {');
            expect(lines[i++]).toEqual('    ');
            expect(lines[i++]).toEqual('    ');
            expect(lines[i++]).toEqual('    default() {');
            expect(lines[i++]).toEqual('      return builder;');
            expect(lines[i++]).toEqual('    },');
            expect(lines[i++]).toEqual('    build() {');
            expect(lines[i++]).toEqual('      return new EmptyClass();');
            expect(lines[i++]).toEqual('    }');
            expect(lines[i++]).toEqual('  };');
            expect(lines[i++]).toEqual('');
            expect(lines[i++]).toEqual('  return builder;');
            expect(lines[i++]).toEqual('}');
            expect(lines[i++]).toEqual('');

        });
    });

    describe('targeting a nested path file', () => {
        let tree: Tree;
        beforeEach(() => {
            tree = Tree.empty();
        });

        it('creates a file in the same path depth as the name passed in', async  () => {
            const { run, fullFileName, add } = setupBase(folder, './a-folder/with/an/empty-class.ts');
            add(fullFileName);

            const result = await run({ name: fullFileName });
            expect(result.files.length).toBe(2); // the empty class + the new spec file
            expect(result.files[1]).toMatch('/a-folder/with/an/empty-class.spec.ts');
        });
    });

    describe('', () => {

        it('targeting the has-one-constructor-param class it creates boilerplate with a new instance with one matching constructor parameter ', async  () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, 'has-one-constructor-parameter.ts');
            add(fullFileName);
            const result = await run({ name: fullFileName });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents).toMatch(/return new HasOneConstructorParameter\(service\);/);
        });
    });

    describe('targeting the example component class', () => {
        const component = 'example.component.ts';
        it('creates a file with matching number of `it` calls for each public method ', async  () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            const result = await run({ name: fullFileName });
            // assert
            const contents = result.readContent(testFileName);
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
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            const result = await run({ name: fullFileName });
            // assert
            const contents = result.readContent(testFileName);
            expect(contents).toMatch(/it\('when aMethod is called/); // the `it` test method
            expect(contents).toMatch(/\.aMethod\(\)/g); // the call to the component's `aMethod` method
        });
    });

    describe('targeting a class with imports', () => {

        const component = 'with-imports.component.ts';

        it('adds the imports for the dependencies', async  () => {
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);
            const result = await run({ name: fullFileName });
            // assert
            const contents = result.readContent(testFileName);
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
            const { run, fullFileName, testFileName, add } = setupBase(folder, component);
            add(fullFileName);

            add(
               testFileName,
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
            // act
            const result = await run({ name: fullFileName, update: true });
            // assert
            const contents = result.readContent(testFileName);

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
